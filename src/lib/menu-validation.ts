export interface MenuItem {
  name: string
  price?: string
  description?: string
}

export interface MenuSection {
  name: string
  items: MenuItem[]
}

export interface MenuStructure {
  sections: MenuSection[]
}

/**
 * Validates and fixes the menu structure to ensure it conforms to the expected format
 */
export function validateMenuStructure(data: any): MenuStructure {
  // If data is null or undefined, return empty structure
  if (!data) {
    return {
      sections: [{
        name: 'General',
        items: []
      }]
    }
  }

  // If data doesn't have sections, create a default structure
  if (!data.sections || !Array.isArray(data.sections)) {
    // Try to extract items from the data if they exist
    let items: MenuItem[] = []
    
    if (data.items && Array.isArray(data.items)) {
      items = data.items.map((item: any) => ({
        name: item.name || 'Unknown Item',
        price: item.price || '',
        description: item.description || ''
      }))
    }
    
    return {
      sections: [{
        name: 'General',
        items
      }]
    }
  }

  // Validate and fix each section
  const validSections = data.sections.map((section: any) => {
    const validSection: MenuSection = {
      name: section.name || 'Unnamed Section',
      items: []
    }

    // Validate and fix each item in the section
    if (section.items && Array.isArray(section.items)) {
      validSection.items = section.items.map((item: any) => ({
        name: item.name || 'Unknown Item',
        price: item.price || '',
        description: item.description || ''
      }))
    }

    return validSection
  })

  // Remove empty sections
  const filteredSections = validSections.filter(section => section.items.length > 0)

  // If all sections are empty, return a default structure
  if (filteredSections.length === 0) {
    return {
      sections: [{
        name: 'General',
        items: []
      }]
    }
  }

  return {
    sections: filteredSections
  }
}