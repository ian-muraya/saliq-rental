// lib/utils.ts
// Helper utilities for the application

export function getFloorDisplayName(floorNumber: number, customName?: string | null): string {
  if (customName) return customName
  
  switch (floorNumber) {
    case 0:
      return 'Ground Floor'
    case 1:
      return 'First Floor'
    case 2:
      return 'Second Floor'
    case 3:
      return 'Third Floor'
    default:
      return `${floorNumber}th Floor`
  }
}

export function getFloorShortName(floorNumber: number): string {
  switch (floorNumber) {
    case 0:
      return 'GF'
    case 1:
      return '1st'
    case 2:
      return '2nd'
    case 3:
      return '3rd'
    default:
      return `${floorNumber}th`
  }
}