import {
  LayoutDashboard,
  Users,
  FileText,
  Leaf,
  ShoppingCart,
  Settings,
  Shield,
  TrendingUp,
  History,
  MessageCircle,
  Package,
  UserCog,
  BarChart3,
  DollarSign,
  Eye,
  GraduationCap,
  BookOpen,
  Library,
  Video,
  Calendar,
  Heart,
  ShoppingBag,
  LineChart,
  Mail
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  titleKey: string;
  url?: string;
  icon: LucideIcon;
  children?: NavigationItem[];
}

export const adminItems: NavigationItem[] = [
  { titleKey: 'nav.overview', url: '/dashboard', icon: LayoutDashboard },
  { 
    titleKey: 'nav.insights', 
    icon: BarChart3,
    children: [
      { titleKey: 'nav.analytics', url: '/dashboard/admin/insights/analytics', icon: TrendingUp },
      { titleKey: 'nav.sales', url: '/dashboard/admin/insights/sales', icon: DollarSign },
      { titleKey: 'nav.users', url: '/dashboard/admin/insights/users', icon: Users },
      { titleKey: 'nav.pageViews', url: '/dashboard/admin/insights/page-views', icon: Eye },
      { titleKey: 'nav.courses', url: '/dashboard/admin/insights/courses', icon: GraduationCap },
    ]
  },
  {
    titleKey: 'nav.liveMeetings',
    icon: Video,
    children: [
      { titleKey: 'nav.manageMeetings', url: '/dashboard/admin/live-meetings', icon: Settings },
      { titleKey: 'nav.manageSessions', url: '/dashboard/admin/live-meetings', icon: Settings },
      { titleKey: 'nav.upcomingMeetings', url: '/dashboard/live-meetings', icon: Calendar },
      { titleKey: 'nav.upcomingSessions', url: '/dashboard/live-meetings', icon: Calendar },
    ]
  },
  { titleKey: 'nav.products', url: '/dashboard/herbs', icon: Leaf },
  { titleKey: 'nav.inventory', url: '/dashboard/herbs', icon: Leaf },
  { titleKey: 'nav.orders', url: '/dashboard/orders', icon: Package },
  { titleKey: 'nav.userManagement', url: '/dashboard/admin/users', icon: Shield },
  { titleKey: 'nav.patientManagement', url: '/dashboard/admin/patients', icon: UserCog },
  { titleKey: 'nav.courseManagement', url: '/dashboard/admin/courses', icon: GraduationCap },
  { titleKey: 'nav.certificateManagement', url: '/dashboard/admin/certificates', icon: Shield },
  { titleKey: 'nav.progressMetrics', url: '/dashboard/admin/progress-metrics', icon: LineChart },
  { titleKey: 'nav.supportMessages', url: '/dashboard/admin/support-messages', icon: MessageCircle },
  { titleKey: 'nav.contactSubmissions', url: '/dashboard/admin/contact-submissions', icon: Mail },
];

export const practitionerItems: NavigationItem[] = [
  { titleKey: 'nav.overview', url: '/dashboard', icon: LayoutDashboard },
  {
    titleKey: 'nav.training',
    icon: GraduationCap,
    children: [
      { titleKey: 'nav.browseCourses', url: '/dashboard/courses', icon: BookOpen },
      { titleKey: 'nav.myCourses', url: '/dashboard/courses/my-courses', icon: Library },
      { titleKey: 'nav.myCertifications', url: '/dashboard/practitioner/certifications', icon: Shield },
    ],
  },
  {
    titleKey: 'nav.liveMeetings',
    icon: Video,
    children: [
      { titleKey: 'nav.myMeetings', url: '/dashboard/practitioner/live-meetings', icon: Video },
      { titleKey: 'nav.mySessions', url: '/dashboard/practitioner/live-meetings', icon: Video },
      { titleKey: 'nav.upcomingMeetings', url: '/dashboard/live-meetings', icon: Calendar },
      { titleKey: 'nav.upcomingSessions', url: '/dashboard/live-meetings', icon: Calendar },
    ]
  },
  { titleKey: 'nav.myPatients', url: '/dashboard/patients', icon: Users },
  { titleKey: 'nav.myStudents', url: '/dashboard/patients', icon: Users },
  { titleKey: 'nav.submissions', url: '/dashboard/practitioner/submissions', icon: FileText },
  { titleKey: 'nav.messages', url: '/dashboard/practitioner/messages', icon: MessageCircle },
  { titleKey: 'nav.recommendations', url: '/dashboard/recommendations', icon: FileText },
  { titleKey: 'nav.assignments', url: '/dashboard/recommendations', icon: FileText },
  { titleKey: 'nav.productCatalog', url: '/dashboard/herbs', icon: Leaf },
  { titleKey: 'nav.orders', url: '/dashboard/orders', icon: ShoppingCart },
  { titleKey: 'nav.salesCommission', url: '/dashboard/practitioner/analytics', icon: TrendingUp },
];

export const patientItems: NavigationItem[] = [
  { titleKey: 'nav.healthOverview', url: '/dashboard/student/records', icon: LayoutDashboard },
  {
    titleKey: 'nav.training',
    icon: GraduationCap,
    children: [
      { titleKey: 'nav.browseCourses', url: '/dashboard/courses', icon: BookOpen },
      { titleKey: 'nav.myCourses', url: '/dashboard/courses/my-courses', icon: Library },
    ],
  },
  { titleKey: 'nav.liveMeetings', url: '/dashboard/live-meetings', icon: Video },
  { titleKey: 'nav.messages', url: '/dashboard/patient/messages', icon: MessageCircle },
  { titleKey: 'nav.productCatalog', url: '/dashboard/herbs', icon: Leaf },
  { titleKey: 'nav.purchaseHistory', url: '/dashboard/patient/orders', icon: History },
];

export const accountItems: NavigationItem[] = [
  { titleKey: 'nav.settings', url: '/settings', icon: Settings },
];

export function getNavigationItems(role: string): NavigationItem[] {
  switch (role) {
    case 'admin':
    case 'dev':
      return adminItems;
    case 'practitioner':
      return practitionerItems;
    case 'patient':
      return patientItems;
    default:
      return patientItems;
  }
}

export function getNavigationLabel(role: string): string {
  switch (role) {
    case 'admin':
    case 'dev':
      return 'nav.adminDashboard';
    case 'practitioner':
      return 'nav.instructorDashboard';
    case 'patient':
      return 'nav.studentPortal';
    default:
      return 'nav.dashboard';
  }
}
