export interface Restaurant {
  id: string
  name: string
  location: string
  distance_estimate_m: number
  slug: string
  created_at: string
}

export interface MenuImage {
  id: string
  restaurant_id: string
  uploaded_by: string
  storage_path: string
  mime: string
  width?: number
  height?: number
  status: 'uploaded' | 'ocr_pending' | 'ocr_done' | 'manual_review' | 'rejected'
  ocr_result_id?: string
  photo_taken_at?: string | null
  created_at: string
}

export interface OCRResult {
  id: string
  image_id: string
  raw_json: any
  text: string
  words: any
  language: string
  ocr_engine: number
  processing_time_ms: number
  created_at: string
}

export interface Menu {
  id: string
  restaurant_id: string
  menu_image_id: string
  menu_date?: string
  content: any
  verified_by?: string
  created_at: string
}

export interface PhotoUploadData {
  base64: string
  timestamp: string
  fileName?: string
}

export interface MenuItem {
  name: string
  description?: string
  price?: string
}

export interface MenuSection {
  name: string
  items: MenuItem[]
}

export interface ExtractedMenu {
  sections: MenuSection[]
  notes?: string
}