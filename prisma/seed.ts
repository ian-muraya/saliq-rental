// prisma/seed.ts
// Script to create default super admin account

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Check if super admin already exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { 
      email: 'superadmin@saliq.co.ke',
      role: 'ADMIN'
    }
  })

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash('SuperAdmin2025!', 10)
    
    const superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@saliq.co.ke',
        phone: '254700000001',
        password: hashedPassword,
        role: 'ADMIN',
        companyName: 'Saliq Software Solutions - Super Admin',
        registeredProperties: 0,
        isActive: true,
        isRestricted: false,
        adminPermissions: {
          canManageAdmins: true,
          canManageLandlords: true,
          canViewAllData: true,
          canManageSystem: true
        }
      }
    })
    
    console.log('✅ Super Admin account created:')
    console.log('   Email: superadmin@saliq.co.ke')
    console.log('   Password: SuperAdmin2025!')
    console.log('   ⚠️  IMPORTANT: Change this password after first login!')
  } else {
    console.log('ℹ️  Super Admin account already exists')
  }

  console.log('🌱 Seeding complete!')
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })