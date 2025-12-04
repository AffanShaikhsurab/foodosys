'use client';

import { SignUp } from '@clerk/nextjs';
import '../../../styles/auth.css';

const localization = {
    signUp: {
        start: {
            title: '',
            subtitle: '',
            actionText: "Already have an account?",
            actionLink: "Sign in",
        },
    },
    socialButtonsBlockButton: "Continue with {{provider|titleize}}",
    dividerText: "or use email",
    formButtonPrimary: "Continue",
};

export default function SignUpPage() {
    return (
        <div className="auth-page">
            {/* Organic Background Blobs */}
            <div className="auth-blob auth-blob-1"></div>
            <div className="auth-blob auth-blob-2"></div>

            <div className="auth-wrapper">
                {/* Brand Header */}
                <div className="auth-brand-header">
                    <div className="auth-brand-logo">
                        <i className="ri-leaf-fill"></i>
                        foodosys
                    </div>
                    <p className="auth-brand-tagline">
                        Join the foodosys community today!
                    </p>
                </div>

                {/* Clerk Sign Up Component */}
                <SignUp
                    appearance={{
                        variables: {
                            colorPrimary: '#DCEB66',
                            colorText: '#1F291F',
                            colorTextSecondary: '#889287',
                            colorBackground: '#FFFFFF',
                            colorInputBackground: '#F9FAFB',
                            colorInputText: '#2C3E2E',
                            fontFamily: "'DM Sans', sans-serif",
                            borderRadius: '32px',
                        },
                        elements: {
                            rootBox: 'mx-auto w-full',
                            card: 'shadow-none border-0 bg-transparent p-0',
                            header: 'hidden',
                        },
                        layout: {
                            socialButtonsPlacement: 'top',
                            socialButtonsVariant: 'blockButton',
                        }
                    }}
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                    localization={localization}
                />

                {/* Trust Signal */}
                <div className="auth-secured-badge">
                    <i className="ri-lock-fill"></i>
                    Secured by Clerk
                </div>
            </div>
        </div>
    );
}
