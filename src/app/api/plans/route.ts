export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
    const plans = [
        {
            _id: "silver",
            name: "Silver Plan",
            price: 1300,
            description: "Perfect for beginners starting their fitness journey with balanced nutrition.",
            image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop",
            features: [
                "10 meals per week",
                "Balanced macros",
                "Weekly planning",
                "Email support"
            ],
            infoContent: [
                "Enjoy nutritious meals without the hassle of meal prep, ideal for those new to fitness nutrition."
            ],
            isPopular: false,
            badgeColor: "silver"
        },
        {
            _id: "gold",
            name: "Gold Plan",
            price: 1500,
            description: "Ideal for dedicated fitness enthusiasts looking for optimal results.",
            image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop",
            features: [
                "10 meals per week",
                "Custom macro targets",
                "Flexible meal swapping",
                "24/7 priority support",
                "Monthly check-ins"
            ],
            infoContent: [
                "Get the flexibility to swap meals based on your preferences while maintaining optimal nutrition."
            ],
            isPopular: true,
            badgeColor: "gold"
        },
        {
            _id: "platinum",
            name: "Platinum Plan",
            price: 2000,
            description: "The ultimate package for athletes seeking peak performance.",
            image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop",
            features: [
                "10 meals + juices",
                "Personalized recipes",
                "1-on-1 nutritionist",
                "Workout meal timing",
                "Weekly analytics"
            ],
            infoContent: [
                "Experience elite-level nutrition with dedicated support, ensuring every meal accelerates your path to excellence."
            ],
            isPopular: false,
            badgeColor: "platinum"
        }
    ];

    return NextResponse.json(plans);
}
