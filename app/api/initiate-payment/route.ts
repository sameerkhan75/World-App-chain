import { NextRequest, NextResponse } from 'next/server'

interface PaymentRequest {
  to_address: string
  author_name: string
  post_title: string
}

export async function POST(req: NextRequest) {
  try {
    const { to_address, author_name, post_title } = await req.json() as PaymentRequest
    
    // Generate unique reference ID
    const uuid = crypto.randomUUID().replace(/-/g, '')
    
    // TODO: Store the payment details in your database for verification
    // For now, we'll just return the reference
    console.log(`💰 Payment initiated: ${uuid} to ${author_name} for "${post_title}"`)
    
    return NextResponse.json({ 
      id: uuid,
      to_address,
      author_name,
      post_title
    })
  } catch (error) {
    console.error('Error initiating payment:', error)
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 })
  }
}
