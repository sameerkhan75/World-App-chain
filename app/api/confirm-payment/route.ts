import { NextRequest, NextResponse } from 'next/server'
import { MiniAppPaymentSuccessPayload } from '@worldcoin/minikit-js'

interface IRequestPayload {
  payload: MiniAppPaymentSuccessPayload
}

export async function POST(req: NextRequest) {
  try {
    const { payload } = (await req.json()) as IRequestPayload
    
    console.log('💰 Confirming payment:', {
      reference: payload.reference,
      transaction_id: payload.transaction_id
    })

    // IMPORTANT: Here we should fetch the reference from database to ensure 
    // the transaction we are verifying is the same one we initiated
    // For demo purposes, we'll skip this step
    
    // Check if we have the required environment variables
    if (!process.env.APP_ID || !process.env.DEV_PORTAL_API_KEY) {
      console.warn('💰 APP_ID or DEV_PORTAL_API_KEY missing. Optimistically accepting payment in dev mode.')
      return NextResponse.json({ success: true, dev_mode: true })
    }

    // Verify with World Developer Portal API
    const response = await fetch(
      `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${process.env.APP_ID}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.DEV_PORTAL_API_KEY}`,
        },
      }
    )

    if (!response.ok) {
      console.error('💰 Failed to verify payment with Developer Portal:', response.status)
      return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 400 })
    }

    const transaction = await response.json()
    console.log('💰 Transaction verification result:', transaction)

    // Check if transaction is valid and not failed
    if (transaction.reference === payload.reference && transaction.status !== 'failed') {
      console.log('✅ Payment verified successfully!')
      // TODO: Update your database to mark the payment as confirmed
      // TODO: Update post statistics, user balances, etc.
      
      return NextResponse.json({ success: true, transaction })
    } else {
      console.error('💰 Payment verification failed:', transaction)
      return NextResponse.json({ success: false, transaction }, { status: 400 })
    }
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 })
  }
}
