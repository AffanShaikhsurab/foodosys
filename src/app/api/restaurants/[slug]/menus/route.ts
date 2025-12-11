import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { NotFoundError, DatabaseError, handleAPIError } from '@/lib/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const requestId = Math.random().toString(36).substring(7)
  const startTime = Date.now()

  try {
    const { slug } = params
    console.log(`[Menus API] ${requestId} Request received:`, {
      slug,
      url: request.url,
      timestamp: new Date().toISOString()
    })

    // First get the restaurant
    console.log(`[Menus API] ${requestId} Looking up restaurant by slug:`, { slug })

    // OPTIMIZATION: Create server client ONCE and reuse for all queries
    const supabase = await createServerClient()

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, slug')
      .eq('slug', slug)
      .single()

    console.log(`[Menus API] ${requestId} Restaurant lookup completed:`, {
      found: !!restaurant,
      restaurantError: restaurantError?.message,
      restaurantId: (restaurant as any)?.id,
      restaurantName: (restaurant as any)?.name,
      lookupDuration: `${Date.now() - startTime}ms`
    })

    if (restaurantError || !restaurant) {
      console.error(`[Menus API] ${requestId} Restaurant not found:`, {
        slug,
        error: restaurantError?.message,
        code: restaurantError?.code
      })
      throw new NotFoundError('Restaurant not found')
    }

    // At this point, restaurant is guaranteed to exist
    const restaurantId = (restaurant as { id: string }).id
    console.log(`[Menus API] ${requestId} Restaurant identified:`, {
      restaurantId,
      slug,
      name: (restaurant as any)?.name
    })

    // Get the menus for this restaurant (show both ocr_done and ocr_pending)
    console.log(`[Menus API] ${requestId} Building menu_images query:`, {
      restaurantId,
      filters: {
        restaurant_id: restaurantId,
        status: ['ocr_done', 'ocr_pending']
      }
    })

    const query = supabase
      .from('menu_images')
      .select(`
        id,
        restaurant_id,
        storage_path,
        mime,
        status,
        created_at,
        uploaded_by,
        is_anonymous,
        anonymous_display_name,
        ocr_results!ocr_results_image_id_fkey(*),
        menus!menus_menu_image_id_fkey(
          id,
          menu_date,
          content,
          created_at
        )
      `)
      .eq('restaurant_id', restaurantId)
      .in('status', ['ocr_done', 'ocr_pending'])
      .order('created_at', { ascending: false })
      .limit(10)

    console.log(`[Menus API] ${requestId} Query built, about to execute`)

    const { data, error } = await query

    const queryDuration = Date.now() - startTime
    console.log(`[Menus API] ${requestId} Query executed:`, {
      duration: `${queryDuration}ms`,
      error: error?.message,
      errorCode: error?.code,
      errorDetails: (error as any)?.details,
      recordsReturned: data?.length || 0,
      restaurantId
    })

    if (error) {
      console.error(`[Menus API] ${requestId} Database error:`, {
        message: error.message,
        code: error.code,
        details: (error as any)?.details,
        restaurantId
      })
      throw new DatabaseError('Failed to fetch menus', error)
    }

    // Fetch contributor information for each menu image
    if (data && data.length > 0) {
      console.log(`[Menus API] ${requestId} Fetching contributor information for ${data.length} images`)

      // Separate anonymous and authenticated uploads
      const authenticatedMenus = data.filter((menu: any) => !menu.is_anonymous && menu.uploaded_by)
      const uploaderIds = Array.from(new Set(authenticatedMenus.map((menu: any) => menu.uploaded_by).filter(Boolean)))

      if (uploaderIds.length > 0) {
        const { data: contributors, error: contributorsError } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', uploaderIds)

        if (!contributorsError && contributors) {
          // Map contributors to menu images
          const contributorMap = new Map(
            contributors.map((c: any) => [c.user_id, c])
          )

          data.forEach((menu: any) => {
            if (menu.is_anonymous) {
              // Handle anonymous uploads
              menu.contributor = {
                display_name: menu.anonymous_display_name || 'Anonymous',
                avatar_url: null,
                is_anonymous: true
              }
            } else if (menu.uploaded_by) {
              // Handle authenticated uploads
              menu.contributor = contributorMap.get(menu.uploaded_by) || null
              if (menu.contributor) {
                menu.contributor.is_anonymous = false
              }
            }
          })

          console.log(`[Menus API] ${requestId} Contributors mapped successfully:`, {
            contributorsFound: contributors.length,
            imagesWithContributors: data.filter((m: any) => m.contributor).length,
            anonymousImages: data.filter((m: any) => m.is_anonymous).length
          })
        } else {
          console.error(`[Menus API] ${requestId} Failed to fetch contributors:`, contributorsError)

          // Fallback for anonymous uploads if contributor fetch fails
          data.forEach((menu: any) => {
            if (menu.is_anonymous) {
              menu.contributor = {
                display_name: menu.anonymous_display_name || 'Anonymous',
                avatar_url: null,
                is_anonymous: true
              }
            }
          })
        }
      } else {
        // No authenticated uploads, but might have anonymous ones
        data.forEach((menu: any) => {
          if (menu.is_anonymous) {
            menu.contributor = {
              display_name: menu.anonymous_display_name || 'Anonymous',
              avatar_url: null,
              is_anonymous: true
            }
          }
        })
      }
    }

    // Log detailed info about returned menus
    if (data && data.length > 0) {
      console.log(`[Menus API] ${requestId} Menus found:`, {
        count: data.length,
        restaurantId
      })
      data.forEach((menu: any, index: number) => {
        console.log(`[Menus API] ${requestId} Menu ${index + 1}:`, {
          id: menu.id,
          restaurant_id: menu.restaurant_id,
          storage_path: menu.storage_path,
          status: menu.status,
          mime: menu.mime,
          created_at: menu.created_at,
          hasOcrResults: !!menu.ocr_results && menu.ocr_results.length > 0
        })
      })
    } else {
      console.log(`[Menus API] ${requestId} No menus found:`, {
        restaurantId,
        slug,
        queryDuration: `${Date.now() - startTime}ms`
      })
    }

    console.log(`[Menus API] ${requestId} Returning response:`, {
      menuCount: data?.length || 0,
      totalDuration: `${Date.now() - startTime}ms`,
      restaurantId
    })

    return NextResponse.json({ menus: data || [] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`[Menus API] ${requestId} Error caught:`, {
      error: errorMsg,
      fullError: JSON.stringify(error),
      totalDuration: `${Date.now() - startTime}ms`
    })
    return handleAPIError(error)
  }
}