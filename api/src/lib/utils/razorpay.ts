import RazorPay from "razorpay";

const razorPayInstance = new RazorPay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

export { razorPayInstance }