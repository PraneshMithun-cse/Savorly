#!/bin/bash
set -x

export YES=1

# We add to all environments
ENV_NAMES="production preview development"

for ENV in $ENV_NAMES; do
  yes y | npx vercel env rm NEXT_PUBLIC_SUPABASE_URL $ENV || true
  echo -n "https://zuqauddgyxcciuivkmjp.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL $ENV
  
  yes y | npx vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY $ENV || true
  echo -n "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1cWF1ZGRneXhjY2l1aXZrbWpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTQ2NTMsImV4cCI6MjA4NzA5MDY1M30.TAZXoEWmWmH0uMOYeO329HcQ1UT1U_LeucFPHH_CCp0" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY $ENV

  yes y | npx vercel env rm RAZORPAY_KEY_ID $ENV || true
  echo -n "rzp_test_SDiRFPP28IeoVs" | npx vercel env add RAZORPAY_KEY_ID $ENV
  
  yes y | npx vercel env rm RAZORPAY_KEY_SECRET $ENV || true
  echo -n "ba77iC9BLd0Jwszettxz6d8S" | npx vercel env add RAZORPAY_KEY_SECRET $ENV
  
  yes y | npx vercel env rm NEXT_PUBLIC_RAZORPAY_KEY_ID $ENV || true
  echo -n "rzp_test_SDiRFPP28IeoVs" | npx vercel env add NEXT_PUBLIC_RAZORPAY_KEY_ID $ENV
done

npx vercel pull --yes --environment=development
