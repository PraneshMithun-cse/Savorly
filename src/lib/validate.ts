/**
 * Input validation and sanitization utilities for Savorly API routes.
 * Prevents NoSQL injection, XSS, and parameter tampering.
 */

// ─── String Sanitization ───────────────────────────────────────────
const HTML_ENTITIES: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;'
};

export function sanitizeString(input: unknown, maxLength = 500): string {
    if (typeof input !== 'string') return '';
    return input
        .trim()
        .substring(0, maxLength)
        .replace(/[&<>"'/]/g, char => HTML_ENTITIES[char] || char)
        // Strip MongoDB operators ($gt, $ne, etc.)
        .replace(/\$[a-zA-Z]+/g, '')
        // Remove null bytes
        .replace(/\0/g, '');
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        // Strip keys starting with $ (MongoDB operators)
        if (key.startsWith('$')) continue;
        if (typeof value === 'string') {
            clean[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            clean[key] = sanitizeObject(value);
        } else {
            clean[key] = value;
        }
    }
    return clean;
}

// ─── Validators ────────────────────────────────────────────────────
export function validateEmail(email: unknown): string | null {
    if (typeof email !== 'string') return null;
    const trimmed = email.trim().toLowerCase();
    if (trimmed.length > 254) return null;
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(trimmed) ? trimmed : null;
}

export function validatePhone(phone: unknown): string | null {
    if (typeof phone !== 'string') return null;
    const digits = phone.replace(/[\s\-()]/g, '');
    // Indian phone: 10 digits, optionally prefixed with +91 or 91 or 0
    const re = /^(?:\+?91|0)?([6-9]\d{9})$/;
    const match = digits.match(re);
    return match ? match[1] : null;
}

export function validateAmount(amount: unknown): number | null {
    if (typeof amount !== 'number' || !isFinite(amount)) return null;
    if (amount <= 0 || amount > 100000) return null;
    return Math.round(amount * 100) / 100; // 2 decimal precision
}

// ─── Order Payload Validation ──────────────────────────────────────
interface OrderItem {
    id?: string;
    name: string;
    price: number;
    quantity: number;
}

interface CustomerInfo {
    name: string;
    email?: string;
    phone: string;
    address: string;
}

export interface ValidatedOrderPayload {
    items: OrderItem[];
    totalAmount: number;
    subtotal: number;
    discount: number;
    paymentMethod: string;
    customer: CustomerInfo;
    userId: string;
    userEmail: string;
    coupon: string | null;
}

export function validateOrderPayload(body: any): { valid: true; data: ValidatedOrderPayload } | { valid: false; error: string } {
    // Items
    if (!Array.isArray(body.items) || body.items.length === 0) {
        return { valid: false, error: 'Order must contain at least one item' };
    }
    if (body.items.length > 50) {
        return { valid: false, error: 'Too many items in order' };
    }

    const items: OrderItem[] = [];
    for (const item of body.items) {
        const id = item.id ? sanitizeString(item.id, 100) : undefined;
        const name = sanitizeString(item.name, 200);
        if (!name) return { valid: false, error: 'Item name is required' };
        const price = validateAmount(item.price);
        if (price === null) return { valid: false, error: `Invalid price for ${name}` };
        const quantity = Math.floor(Number(item.quantity));
        if (!quantity || quantity < 1 || quantity > 99) return { valid: false, error: `Invalid quantity for ${name}` };
        items.push({ id, name, price, quantity });
    }

    // Amounts
    const totalAmount = validateAmount(body.totalAmount);
    if (totalAmount === null) return { valid: false, error: 'Invalid total amount' };
    const subtotal = validateAmount(body.subtotal ?? body.totalAmount) ?? totalAmount;
    const discount = typeof body.discount === 'number' ? Math.max(0, body.discount) : 0;

    // Payment method
    const allowedMethods = ['cod', 'razorpay', 'upi', 'gpay', 'phonepe'];
    const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod.toLowerCase() : 'cod';
    if (!allowedMethods.includes(paymentMethod)) {
        return { valid: false, error: 'Invalid payment method' };
    }

    // Customer
    if (!body.customer || typeof body.customer !== 'object') {
        return { valid: false, error: 'Customer info is required' };
    }
    const custName = sanitizeString(body.customer.name, 100);
    if (!custName) return { valid: false, error: 'Customer name is required' };
    const custPhone = sanitizeString(body.customer.phone, 15);
    if (!custPhone) return { valid: false, error: 'Customer phone is required' };
    const custAddress = sanitizeString(body.customer.address, 500);
    if (!custAddress) return { valid: false, error: 'Delivery address is required' };

    // User
    const userId = sanitizeString(body.userId, 128) || 'guest';
    const userEmail = sanitizeString(body.userEmail, 254);

    return {
        valid: true,
        data: {
            items, totalAmount, subtotal, discount, paymentMethod,
            customer: { name: custName, phone: custPhone, address: custAddress },
            userId, userEmail,
            coupon: body.coupon ? sanitizeString(body.coupon, 20) : null
        }
    };
}

// ─── Address Validation ────────────────────────────────────────────
export function validateAddress(addr: any): { valid: true; data: any } | { valid: false; error: string } {
    if (!addr || typeof addr !== 'object') {
        return { valid: false, error: 'Address object is required' };
    }
    const city = sanitizeString(addr.city, 100);
    if (!city) return { valid: false, error: 'City is required' };
    const phone = sanitizeString(addr.phone, 15);
    if (!phone) return { valid: false, error: 'Phone number is required' };

    return {
        valid: true,
        data: {
            label: sanitizeString(addr.label, 20) || 'Home',
            name: sanitizeString(addr.name, 100),
            phone,
            doorNo: sanitizeString(addr.doorNo, 50),
            apartment: sanitizeString(addr.apartment, 100),
            street: sanitizeString(addr.street, 200),
            line1: sanitizeString(addr.line1, 200),
            landmark: sanitizeString(addr.landmark, 200),
            city,
            state: sanitizeString(addr.state, 50) || 'Tamil Nadu',
            pincode: sanitizeString(addr.pincode, 10),
            id: addr.id || Date.now()
        }
    };
}

// ─── Payload Size Check ────────────────────────────────────────────
export function checkPayloadSize(body: any, maxBytes = 100_000): boolean {
    try {
        return JSON.stringify(body).length <= maxBytes;
    } catch {
        return false;
    }
}
