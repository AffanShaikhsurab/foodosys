import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

/**
 * DEBUG ENDPOINT: Traces the complete menu retrieval flow
 * Usage: GET /api/debug/menu-trace?slug=magna
 * 
 * This endpoint provides detailed information about:
 * 1. Restaurant lookup
 * 2. Menu images in database
 * 3. Storage files in bucket
 * 4. URL generation and accessibility
 */

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  const startTime = Date.now()
  
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Missing slug parameter. Usage: /api/debug/menu-trace?slug=magna' },
        { status: 400 }
      )
    }
    
    console.log(`[DEBUG] ${requestId} Menu trace started:`, { slug, timestamp: new Date().toISOString() })
    
    const result: any = {
      requestId,
      timestamp: new Date().toISOString(),
      slug,
      steps: {}
    }
    
    // Step 1: Look up restaurant
    console.log(`[DEBUG] ${requestId} Step 1: Restaurant lookup`)
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .single()
    
    result.steps.restaurant_lookup = {
      success: !restaurantError && !!restaurant,
      error: restaurantError?.message,
      restaurant: restaurant ? {
        id: (restaurant as any).id,
        name: (restaurant as any).name,
        slug: (restaurant as any).slug,
        location: (restaurant as any).location
      } : null
    }
    
    if (restaurantError || !restaurant) {
      console.error(`[DEBUG] ${requestId} Restaurant not found`)
      result.steps.restaurant_lookup.error = restaurantError?.message
      return NextResponse.json(result)
    }
    
    const restaurantId = (restaurant as any).id
    
    // Step 2: Check menu_images table
    console.log(`[DEBUG] ${requestId} Step 2: Database menu_images check`)
    const { data: allMenus, error: allMenusError } = await supabaseAdmin
      .from('menu_images')
      .select('*')
      .eq('restaurant_id', restaurantId)
    
    result.steps.database_check = {
      success: !allMenusError,
      error: allMenusError?.message,
      totalMenusInDb: allMenus?.length || 0,
      menusWithCorrectStatus: allMenus?.filter((m: any) => ['ocr_done', 'ocr_pending'].includes(m.status)).length || 0,
      allMenus: allMenus ? allMenus.map((m: any) => ({
        id: m.id,
        restaurant_id: m.restaurant_id,
        storage_path: m.storage_path,
        status: m.status,
        mime: m.mime,
        created_at: m.created_at,
        uploaded_by: m.uploaded_by
      })) : []
    }
    
    // Step 3: Check storage bucket
    console.log(`[DEBUG] ${requestId} Step 3: Storage bucket check`)
    
    // List files in menus/[slug] folder
    const { data: storageFiles, error: storageError } = await supabaseAdmin.storage
      .from('menu-images')
      .list(`menus/${slug}`, { limit: 100 })
    
    result.steps.storage_check = {
      success: !storageError,
      error: storageError?.message,
      bucket: 'menu-images',
      path: `menus/${slug}`,
      filesInStorage: storageFiles ? storageFiles
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => ({
          name: f.name,
          size: f.metadata?.size || 'unknown',
          updated_at: f.updated_at,
          mimetype: f.metadata?.mimetype
        })) : []
    }
    
    // Step 4: Validate each menu file exists in storage
    console.log(`[DEBUG] ${requestId} Step 4: File existence validation`)
    const fileValidation: any = []
    
    if (allMenus) {
      for (const menu of allMenus) {
        const { data, error } = await supabaseAdmin.storage
          .from('menu-images')
          .download(menu.storage_path)
        
        const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/menu-images/${menu.storage_path}`
        
        fileValidation.push({
          menuId: menu.id,
          storagePath: menu.storage_path,
          fileExists: !error && !!data,
          fileSize: data?.size || 0,
          error: error?.message,
          publicUrl,
          status: menu.status
        })
      }
    }
    
    result.steps.file_validation = {
      validationRun: fileValidation.length > 0,
      files: fileValidation
    }
    
    // Step 5: Run the actual query that the menus API uses
    console.log(`[DEBUG] ${requestId} Step 5: Running actual menus API query`)
    const { data: queryResult, error: queryError } = await supabase
      .from('menu_images')
      .select('*, ocr_results(*)')
      .eq('restaurant_id', restaurantId)
      .in('status', ['ocr_done', 'ocr_pending'])
      .order('created_at', { ascending: false })
      .limit(10)
    
    result.steps.api_query = {
      success: !queryError,
      error: queryError?.message,
      recordsReturned: queryResult?.length || 0,
      records: queryResult ? queryResult.map((m: any) => ({
        id: m.id,
        restaurant_id: m.restaurant_id,
        storage_path: m.storage_path,
        status: m.status,
        hasOcrResults: !!m.ocr_results && m.ocr_results.length > 0
      })) : []
    }
    
    // Step 6: Summary and recommendations
    console.log(`[DEBUG] ${requestId} Step 6: Analysis`)
    
    const issues: string[] = []
    const recommendations: string[] = []
    
    if (!result.steps.restaurant_lookup.success) {
      issues.push('Restaurant not found')
      recommendations.push(`Verify slug "${slug}" exists in restaurants table`)
    }
    
    if (result.steps.database_check.totalMenusInDb === 0) {
      issues.push('No menu records in database for this restaurant')
      recommendations.push('Upload a menu image first')
    }
    
    if (result.steps.storage_check.filesInStorage.length === 0) {
      issues.push('No files in storage bucket')
      recommendations.push('Check upload route - files might not be reaching storage')
    }
    
    if (result.steps.database_check.totalMenusInDb > 0 && result.steps.storage_check.filesInStorage.length === 0) {
      issues.push('Database-Storage Mismatch: Records exist but files not in storage')
      recommendations.push('Check upload route storage.upload() call')
    }
    
    const filesNotFoundInStorage = fileValidation.filter(f => !f.fileExists)
    if (filesNotFoundInStorage.length > 0) {
      issues.push(`${filesNotFoundInStorage.length} database records point to non-existent storage files`)
      filesNotFoundInStorage.forEach(f => {
        recommendations.push(`File not found: ${f.storagePath}`)
      })
    }
    
    if (result.steps.api_query.recordsReturned === 0 && result.steps.database_check.totalMenusInDb > 0) {
      issues.push('API query returns 0 records but database has records')
      recommendations.push('Check RLS policies or query filters')
    }
    
    result.analysis = {
      issues,
      recommendations,
      isHealthy: issues.length === 0,
      totalDuration: `${Date.now() - startTime}ms`
    }
    
    console.log(`[DEBUG] ${requestId} Menu trace completed:`, {
      isHealthy: result.analysis.isHealthy,
      issues: issues.length,
      duration: result.analysis.totalDuration
    })
    
    return NextResponse.json(result)
  } catch (error) {
    console.error(`[DEBUG] ${requestId} Error during trace:`, error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId,
      duration: `${Date.now() - startTime}ms`
    }, { status: 500 })
  }
}
