import {
  LayoutDashboard,
  Users,
  PhoneCall,
  CalendarCheck,
  Calendar,
  MapPin,
  Building2,
  Home,
  UserCheck,
  Kanban,
  FileCheck,
  CreditCard,
  UserCog,
  BadgePercent,
  Receipt,
  BarChart3,
  Bell,
  Settings
} from 'lucide-react';

export const NAV_SECTIONS = [
  {
    title: 'CRM & Operations',
    items: [
      {
        title: 'Dashboard',
        path: '/',
        icon: LayoutDashboard,
        roles: ['super_admin', 'admin', 'sales_manager', 'telecaller', 'sales_executive', 'property_manager', 'accountant']
      },
      {
        title: 'Lead Management',
        path: '/leads',
        icon: Users,
        roles: ['super_admin', 'admin', 'sales_manager', 'telecaller', 'sales_executive']
      },
      {
        title: 'Telecaller Desk',
        path: '/telecallers',
        icon: PhoneCall,
        roles: ['super_admin', 'admin', 'sales_manager', 'telecaller']
      },
      {
        title: 'Follow-ups',
        path: '/followups',
        icon: CalendarCheck,
        roles: ['super_admin', 'admin', 'sales_manager', 'telecaller', 'sales_executive']
      },
      {
        title: 'Meetings',
        path: '/meetings',
        icon: Calendar,
        roles: ['super_admin', 'admin', 'sales_manager', 'sales_executive']
      },
      {
        title: 'Site Visits',
        path: '/site-visits',
        icon: MapPin,
        roles: ['super_admin', 'admin', 'sales_manager', 'sales_executive', 'property_manager']
      }
    ]
  },
  {
    title: 'Inventory & Deals',
    items: [
      {
        title: 'Projects',
        path: '/projects',
        icon: Building2,
        roles: ['super_admin', 'admin', 'sales_manager', 'property_manager', 'sales_executive']
      },
      {
        title: 'Units & Inventory',
        path: '/properties',
        icon: Home,
        roles: ['super_admin', 'admin', 'sales_manager', 'property_manager', 'sales_executive']
      },
      {
        title: 'Customers 360',
        path: '/customers',
        icon: UserCheck,
        roles: ['super_admin', 'admin', 'sales_manager', 'sales_executive', 'accountant']
      },
      {
        title: 'Sales Pipeline',
        path: '/opportunities',
        icon: Kanban,
        roles: ['super_admin', 'admin', 'sales_manager', 'sales_executive']
      },
      {
        title: 'Bookings',
        path: '/bookings',
        icon: FileCheck,
        roles: ['super_admin', 'admin', 'sales_manager', 'sales_executive', 'accountant']
      }
    ]
  },
  {
    title: 'Finance & Ledger',
    items: [
      {
        title: 'Payments & Receipts',
        path: '/payments',
        icon: CreditCard,
        roles: ['super_admin', 'admin', 'accountant', 'sales_manager']
      },
      {
        title: 'Commissions',
        path: '/commissions',
        icon: BadgePercent,
        roles: ['super_admin', 'admin', 'sales_manager', 'accountant', 'sales_executive']
      },
      {
        title: 'Accounts & Finance',
        path: '/accounts',
        icon: Receipt,
        roles: ['super_admin', 'admin', 'accountant']
      }
    ]
  },
  {
    title: 'System & Admin',
    items: [
      {
        title: 'Reports & Analytics',
        path: '/reports',
        icon: BarChart3,
        roles: ['super_admin', 'admin', 'sales_manager', 'accountant']
      },
      {
        title: 'Employee Directory',
        path: '/employees',
        icon: UserCog,
        roles: ['super_admin', 'admin', 'sales_manager']
      },
      {
        title: 'Notifications',
        path: '/notifications',
        icon: Bell,
        roles: ['super_admin', 'admin', 'sales_manager', 'telecaller', 'sales_executive', 'property_manager', 'accountant']
      },
      {
        title: 'Settings & Audit',
        path: '/settings',
        icon: Settings,
        roles: ['super_admin', 'admin']
      }
    ]
  }
];

// Flattened list for flat lookups and backward compatibility
export const NAV_ITEMS = NAV_SECTIONS.flatMap((sec) => sec.items);
