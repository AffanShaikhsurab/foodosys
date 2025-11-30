'use client'

import { useRouter } from 'next/navigation'

export default function TermsAndConditions() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-[#FDFDE8]">
            {/* Header with Back Button */}
            <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-[#2C3E2E] hover:text-[#1F291F] transition-colors"
                    >
                        <i className="ri-arrow-left-line text-xl"></i>
                        <span className="font-medium">Back</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-[28px] p-8 md:p-12 shadow-[0_8px_24px_rgba(44,62,46,0.08)]">
                    <h1 className="text-3xl md:text-4xl font-bold text-[#2C3E2E] mb-4">
                        Terms and Conditions
                    </h1>

                    <p className="text-sm text-[#889287] mb-8">
                        Last Updated: December 1, 2025
                    </p>

                    <div className="prose prose-lg max-w-none space-y-6 text-[#1F291F]">
                        {/* Introduction */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#2C3E2E] mb-4">1. Introduction and Acceptance</h2>
                            <p className="mb-4 leading-relaxed">
                                Welcome to FoodoSys ("we," "our," or "the Platform"). By accessing or using this Platform,
                                you ("User" or "you") agree to be bound by these Terms and Conditions ("Terms"). If you do
                                not agree to these Terms, please do not use the Platform.
                            </p>
                            <p className="mb-4 leading-relaxed">
                                FoodoSys is an independent, community-driven platform created to enhance the dining experience
                                within campus food courts and cafeterias. This Platform is not affiliated with, endorsed by,
                                or sponsored by Infosys Limited or any of its subsidiaries or affiliates.
                            </p>
                        </section>

                        {/* Independent Platform */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#2C3E2E] mb-4">2. Independent Platform Declaration</h2>
                            <p className="mb-4 leading-relaxed">
                                <strong>2.1 No Affiliation:</strong> FoodoSys is an independent platform developed by students
                                and community members. It is not created, maintained, or endorsed by Infosys Limited. Any
                                references to campus locations, food courts, or facilities are purely descriptive and do not
                                imply any official relationship or endorsement.
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>2.2 No Intellectual Property Infringement:</strong> This Platform does not claim, use,
                                or infringe upon any intellectual property rights of Infosys Limited, including but not limited
                                to trademarks, service marks, trade names, logos, copyrights, patents, or trade secrets. All
                                intellectual property rights of Infosys Limited remain the exclusive property of Infosys Limited.
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>2.3 Community Purpose:</strong> The sole purpose of this Platform is to improve the
                                community dining experience by providing menu information, facilitating food discovery, and
                                enabling users to share dining experiences. This is a non-commercial, community-focused initiative.
                            </p>
                        </section>

                        {/* User Responsibilities */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#2C3E2E] mb-4">3. User Responsibilities and Conduct</h2>
                            <p className="mb-4 leading-relaxed">
                                <strong>3.1 Accurate Information:</strong> Users agree to provide accurate, current, and complete
                                information when creating an account and using the Platform. You are responsible for maintaining
                                the confidentiality of your account credentials.
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>3.2 Prohibited Activities:</strong> Users shall not:
                            </p>
                            <ul className="list-disc pl-6 mb-4 space-y-2">
                                <li>Use the Platform for any unlawful purpose or in violation of these Terms</li>
                                <li>Upload, post, or transmit any content that infringes intellectual property rights</li>
                                <li>Attempt to gain unauthorized access to the Platform or its related systems</li>
                                <li>Interfere with or disrupt the Platform's functionality or servers</li>
                                <li>Impersonate any person or entity or misrepresent affiliation with any organization</li>
                                <li>Collect or store personal data of other users without explicit consent</li>
                                <li>Use the Platform to distribute spam, malware, or harmful content</li>
                            </ul>
                            <p className="mb-4 leading-relaxed">
                                <strong>3.3 Content Responsibility:</strong> Users are solely responsible for any content they
                                upload, including menu photos, reviews, and comments. By uploading content, you grant FoodoSys
                                a non-exclusive, worldwide, royalty-free license to use, display, and distribute such content
                                for the purpose of operating the Platform.
                            </p>
                        </section>

                        {/* Privacy and Data Protection */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#2C3E2E] mb-4">4. Privacy and Data Protection</h2>
                            <p className="mb-4 leading-relaxed">
                                <strong>4.1 Data Collection:</strong> We collect only the minimum necessary information to
                                provide our services, including email addresses, display names, and user-generated content
                                (menu photos, reviews).
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>4.2 Data Usage:</strong> Your data is used exclusively to:
                            </p>
                            <ul className="list-disc pl-6 mb-4 space-y-2">
                                <li>Provide and improve Platform functionality</li>
                                <li>Authenticate users and maintain account security</li>
                                <li>Display user-contributed content (menu photos, reviews)</li>
                                <li>Communicate important Platform updates</li>
                            </ul>
                            <p className="mb-4 leading-relaxed">
                                <strong>4.3 Data Protection:</strong> We implement industry-standard security measures to protect
                                your personal information. However, no method of transmission over the internet is 100% secure,
                                and we cannot guarantee absolute security.
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>4.4 No Data Sharing:</strong> We do not sell, rent, or share your personal information
                                with third parties except as required by law or with your explicit consent.
                            </p>
                        </section>

                        {/* Intellectual Property */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#2C3E2E] mb-4">5. Intellectual Property Rights</h2>
                            <p className="mb-4 leading-relaxed">
                                <strong>5.1 Platform Ownership:</strong> The Platform's design, code, features, and original
                                content are owned by FoodoSys and protected by copyright, trademark, and other intellectual
                                property laws.
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>5.2 User Content:</strong> Users retain ownership of content they upload but grant
                                FoodoSys the necessary licenses to operate the Platform. Users represent and warrant that they
                                have all necessary rights to the content they upload.
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>5.3 Third-Party Rights:</strong> We respect the intellectual property rights of others.
                                If you believe content on the Platform infringes your rights, please contact us immediately.
                            </p>
                        </section>

                        {/* Disclaimers */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#2C3E2E] mb-4">6. Disclaimers and Limitations</h2>
                            <p className="mb-4 leading-relaxed">
                                <strong>6.1 "As Is" Service:</strong> The Platform is provided "as is" and "as available" without
                                warranties of any kind, either express or implied, including but not limited to warranties of
                                merchantability, fitness for a particular purpose, or non-infringement.
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>6.2 Content Accuracy:</strong> While we strive to provide accurate menu information, we
                                do not guarantee the accuracy, completeness, or timeliness of any content on the Platform. Menu
                                items, prices, and availability are subject to change without notice.
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>6.3 No Professional Advice:</strong> Information on the Platform is for general
                                informational purposes only and does not constitute professional advice. Users should verify
                                information independently before making decisions.
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>6.4 Limitation of Liability:</strong> To the fullest extent permitted by law, FoodoSys
                                and its creators shall not be liable for any indirect, incidental, special, consequential, or
                                punitive damages arising from your use of the Platform.
                            </p>
                        </section>

                        {/* Indemnification */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#2C3E2E] mb-4">7. Indemnification</h2>
                            <p className="mb-4 leading-relaxed">
                                You agree to indemnify, defend, and hold harmless FoodoSys, its creators, contributors, and
                                affiliates from any claims, damages, losses, liabilities, and expenses (including legal fees)
                                arising from:
                            </p>
                            <ul className="list-disc pl-6 mb-4 space-y-2">
                                <li>Your use of the Platform</li>
                                <li>Your violation of these Terms</li>
                                <li>Your violation of any third-party rights, including intellectual property rights</li>
                                <li>Content you upload or transmit through the Platform</li>
                            </ul>
                        </section>

                        {/* Termination */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#2C3E2E] mb-4">8. Account Termination</h2>
                            <p className="mb-4 leading-relaxed">
                                <strong>8.1 By User:</strong> You may terminate your account at any time by contacting us or
                                using the account deletion feature (if available).
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>8.2 By FoodoSys:</strong> We reserve the right to suspend or terminate accounts that
                                violate these Terms, engage in prohibited activities, or for any other reason at our sole discretion.
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>8.3 Effect of Termination:</strong> Upon termination, your right to use the Platform
                                ceases immediately. Provisions that by their nature should survive termination shall survive,
                                including intellectual property rights, disclaimers, and limitations of liability.
                            </p>
                        </section>

                        {/* Modifications */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#2C3E2E] mb-4">9. Modifications to Terms</h2>
                            <p className="mb-4 leading-relaxed">
                                We reserve the right to modify these Terms at any time. Changes will be effective immediately
                                upon posting to the Platform. Your continued use of the Platform after changes are posted
                                constitutes acceptance of the modified Terms. We encourage you to review these Terms periodically.
                            </p>
                        </section>

                        {/* Governing Law */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#2C3E2E] mb-4">10. Governing Law and Dispute Resolution</h2>
                            <p className="mb-4 leading-relaxed">
                                <strong>10.1 Governing Law:</strong> These Terms shall be governed by and construed in accordance
                                with the laws of India, without regard to conflict of law principles.
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>10.2 Dispute Resolution:</strong> Any disputes arising from these Terms or your use of
                                the Platform shall be resolved through good faith negotiations. If negotiations fail, disputes
                                shall be subject to the exclusive jurisdiction of courts in Bangalore, Karnataka, India.
                            </p>
                        </section>

                        {/* Contact Information */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#2C3E2E] mb-4">11. Contact Information</h2>
                            <p className="mb-4 leading-relaxed">
                                For questions, concerns, or notices regarding these Terms, please contact us through the Platform's
                                support channels or feedback mechanisms.
                            </p>
                        </section>

                        {/* Severability */}
                        <section>
                            <h2 className="text-2xl font-bold text-[#2C3E2E] mb-4">12. Severability and Entire Agreement</h2>
                            <p className="mb-4 leading-relaxed">
                                <strong>12.1 Severability:</strong> If any provision of these Terms is found to be unenforceable
                                or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and
                                the remaining provisions shall remain in full force and effect.
                            </p>
                            <p className="mb-4 leading-relaxed">
                                <strong>12.2 Entire Agreement:</strong> These Terms constitute the entire agreement between you
                                and FoodoSys regarding the use of the Platform and supersede all prior agreements and understandings.
                            </p>
                        </section>

                        {/* Final Declaration */}
                        <section className="bg-[#FEF3C7] p-6 rounded-[20px] border-2 border-[#DCEB66]">
                            <h2 className="text-2xl font-bold text-[#2C3E2E] mb-4">Important Declaration</h2>
                            <p className="mb-4 leading-relaxed font-medium">
                                By using FoodoSys, you acknowledge and agree that:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 font-medium">
                                <li>This Platform is completely independent and not affiliated with Infosys Limited</li>
                                <li>This Platform does not infringe upon any intellectual property rights of Infosys Limited</li>
                                <li>This Platform is created solely to improve the community dining experience</li>
                                <li>You will use this Platform responsibly and in accordance with these Terms</li>
                            </ul>
                        </section>

                        {/* Acceptance */}
                        <section className="mt-8 pt-8 border-t-2 border-gray-200">
                            <p className="text-center text-lg font-medium text-[#2C3E2E]">
                                By clicking "I Accept" or by using the Platform, you acknowledge that you have read,
                                understood, and agree to be bound by these Terms and Conditions.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
