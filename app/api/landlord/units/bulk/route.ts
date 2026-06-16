// app/api/landlord/units/bulk/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const body = await request.json()
    const { units } = body
    
    if (!units || units.length === 0) {
      return NextResponse.json({ error: 'No units to create' }, { status: 400 })
    }
    
    const property = await prisma.property.findFirst({
      where: { id: units[0].propertyId, landlordId: decoded.userId }
    })
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    
    const createdUnits = []
    for (const unit of units) {
      const existingUnit = await prisma.unit.findFirst({
        where: { propertyId: unit.propertyId, unitNumber: unit.unitNumber }
      })
      
      if (!existingUnit) {
        const newUnit = await prisma.unit.create({
          data: {
            propertyId: unit.propertyId,
            floorId: unit.floorId,
            unitNumber: unit.unitNumber,
            unitType: unit.unitType,
            rentAmount: unit.rentAmount,
            depositAmount: unit.depositAmount,
            sizeSqm: unit.sizeSqm,
            status: 'AVAILABLE'
          }
        })
        createdUnits.push(newUnit)
        
        if (unit.floorId) {
          await prisma.floor.update({
            where: { id: unit.floorId },
            data: { unitsPerFloor: { increment: 1 } }
          })
        }
      }
    }
    
    await prisma.property.update({
      where: { id: property.id },
      data: { totalUnits: { increment: createdUnits.length } }
    })
    
    return NextResponse.json({ 
      message: `Created ${createdUnits.length} units`,
      units: createdUnits 
    })
  } catch (error) {
    console.error('Bulk unit creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}