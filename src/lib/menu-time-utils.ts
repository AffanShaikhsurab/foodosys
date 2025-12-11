import { MenuImage } from './types'

export type MealType = 'breakfast' | 'lunch' | 'dinner'

/**
 * Determines the meal type based on the time in a timestamp
 * Breakfast: 6:00 AM - 11:00 AM
 * Lunch: 11:00 AM - 4:00 PM
 * Dinner: 4:00 PM - 11:59 PM
 * Late night (12:00 AM - 6:00 AM) is categorized as previous day's dinner
 */
export function getMealType(timestamp: string): MealType {
    const date = new Date(timestamp)
    const hour = date.getHours()

    if (hour >= 6 && hour < 11) {
        return 'breakfast'
    } else if (hour >= 11 && hour < 16) {
        return 'lunch'
    } else {
        return 'dinner'
    }
}

/**
 * Checks if a timestamp is from today (same calendar date)
 */
export function isToday(timestamp: string): boolean {
    const date = new Date(timestamp)
    const today = new Date()

    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    )
}

/**
 * Checks if a timestamp is from yesterday
 */
export function isYesterday(timestamp: string): boolean {
    const date = new Date(timestamp)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    return (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
    )
}

/**
 * Gets the effective timestamp for a menu (photo_taken_at or created_at)
 */
export function getMenuTimestamp(menu: MenuImage): string {
    return menu.photo_taken_at || menu.created_at
}

/**
 * Filters menus into today's and yesterday's buckets
 * Menus older than yesterday are excluded
 */
export function filterMenusByDate(menus: MenuImage[]): {
    today: MenuImage[]
    yesterday: MenuImage[]
} {
    const today: MenuImage[] = []
    const yesterday: MenuImage[] = []

    menus.forEach(menu => {
        const timestamp = getMenuTimestamp(menu)

        if (isToday(timestamp)) {
            today.push(menu)
        } else if (isYesterday(timestamp)) {
            yesterday.push(menu)
        }
        // Menus older than yesterday are not included
    })

    return { today, yesterday }
}

/**
 * Groups menus by meal type based on their timestamp
 */
export function groupMenusByMealType(menus: MenuImage[]): {
    breakfast: MenuImage[]
    lunch: MenuImage[]
    dinner: MenuImage[]
} {
    const breakfast: MenuImage[] = []
    const lunch: MenuImage[] = []
    const dinner: MenuImage[] = []

    menus.forEach(menu => {
        const timestamp = getMenuTimestamp(menu)
        const mealType = getMealType(timestamp)

        switch (mealType) {
            case 'breakfast':
                breakfast.push(menu)
                break
            case 'lunch':
                lunch.push(menu)
                break
            case 'dinner':
                dinner.push(menu)
                break
        }
    })

    return { breakfast, lunch, dinner }
}

/**
 * Gets a display label for a meal type
 */
export function getMealTypeLabel(mealType: MealType): string {
    const labels: Record<MealType, string> = {
        breakfast: 'Breakfast',
        lunch: 'Lunch',
        dinner: 'Dinner'
    }
    return labels[mealType]
}

/**
 * Gets an emoji icon for a meal type
 */
export function getMealTypeIcon(mealType: MealType): string {
    const icons: Record<MealType, string> = {
        breakfast: '🌅',
        lunch: '🌞',
        dinner: '🌙'
    }
    return icons[mealType]
}
