'use client';

import { SignIn } from '@clerk/nextjs';
import '../../../styles/auth.css';

export default function SignInPage() {
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
                        Ready to eat? Let&apos;s get you signed in.
                    </p>
                </div>

                {/* Clerk Sign In Component */}
                <SignIn
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
                            // We keep the footer but style it via CSS
                        },
                        layout: {
                            socialButtonsPlacement: 'top',
                            socialButtonsVariant: 'blockButton',
                        }
                    }}
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
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
