import React from 'react';
import { login } from './auth'

export default function useRole(){
  const { user } = useContext(login)
  return { role: user?.role ?? null, isSuper: !!user?.is_superuser }
}

export function canSeeWarehouses(role, isSuper){
  return isSuper || ['storekeeper','production_manager'].includes(role)
}
