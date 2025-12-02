import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
            <SignIn
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-xl",
                    },
                }}
                routing="path"
                path="/sign-in"
            />
        </div>
    );
}
