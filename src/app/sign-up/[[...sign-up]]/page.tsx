import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
            <SignUp
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-xl",
                    },
                }}
                routing="path"
                path="/sign-up"
            />
        </div>
    );
}
