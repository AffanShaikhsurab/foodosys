/**
 * Admin Configuration
 * Central configuration for admin user management
 */

// The official admin email address
export const ADMIN_EMAIL = 'onbread.assist@gmail.com'

// Check if an email belongs to an admin user
export function isAdminEmail(email: string | undefined | null): boolean {
    if (!email) return false
    return email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
}

// Admin privileges description
export const ADMIN_PRIVILEGES = [
    'Delete any menu images',
    'Manage user profiles',
    'Access admin dashboard',
    'View all contributions',
    'Moderate content'
] as const
