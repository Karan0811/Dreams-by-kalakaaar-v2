// Primitives
export { Button, type ButtonProps } from "./primitives/Button";
export { Input, type InputProps } from "./primitives/Input";
export { PasswordInput } from "./primitives/PasswordInput";
export { Label } from "./primitives/Label";
export { Textarea, type TextareaProps } from "./primitives/Textarea";
export { Checkbox } from "./primitives/Checkbox";
export { Badge, type BadgeProps } from "./primitives/Badge";
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./primitives/Card";
export { Skeleton } from "./primitives/Skeleton";
export { Avatar } from "./primitives/Avatar";
export { Separator } from "./primitives/Separator";
export { FormField, type FormFieldProps } from "./primitives/FormField";
export { RadioGroup, RadioGroupItem, RadioGroupItemRow } from "./primitives/Radio";
export { Switch } from "./primitives/Switch";
export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem } from "./primitives/Select";
export { Chip, type ChipProps } from "./primitives/Chip";
export { SearchInput, type SearchInputProps } from "./primitives/SearchInput";
export { Progress, type ProgressProps } from "./primitives/Progress";
export { CountBadge, type CountBadgeProps } from "./primitives/CountBadge";

// Layout
export { Container, type ContainerProps } from "./layout/Container";
export { Section, type SectionProps } from "./layout/Section";
export { ResponsiveGrid, type ResponsiveGridProps } from "./layout/ResponsiveGrid";
export { AppShell, type AppShellProps } from "./layout/AppShell";
export { TopNav, type TopNavProps } from "./layout/TopNav";
export { UserMenu, type UserMenuProps, type UserMenuItem } from "./layout/UserMenu";
export { NotificationsButton, type NotificationsButtonProps } from "./layout/NotificationsButton";
export { PageHeader, type PageHeaderProps } from "./layout/PageHeader";
export { LoadingLayout } from "./layout/LoadingLayout";
export { EmptyLayout, type EmptyLayoutProps } from "./layout/EmptyLayout";

// Feedback
export { AvailabilityStatusBadge } from "./feedback/StatusBadge";
export { Toaster, toast } from "./feedback/Toaster";
export { Alert, type AlertProps } from "./feedback/Alert";
export { Spinner } from "./feedback/Spinner";
export { EmptyState, type EmptyStateProps } from "./feedback/EmptyState";
export { ErrorState, type ErrorStateProps } from "./feedback/ErrorState";
export { NotFoundState, type NotFoundStateProps } from "./feedback/NotFoundState";
export { ErrorBoundary, type ErrorBoundaryProps } from "./feedback/ErrorBoundary";
export { ApiErrorState, type ApiErrorStateProps, type ApiErrorLike } from "./feedback/ApiErrorState";
export { NetworkErrorState, NetworkErrorIcon, type NetworkErrorStateProps } from "./feedback/NetworkErrorState";
export { RetryButton, type RetryButtonProps } from "./feedback/RetryButton";
export { Shimmer } from "./feedback/Shimmer";

// Overlays
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./overlays/Dialog";
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  type SheetContentProps,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "./overlays/Sheet";
export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerFooter,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "./overlays/Drawer";
export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent } from "./overlays/Popover";
export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./overlays/Tooltip";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./overlays/DropdownMenu";
export { ConfirmDialog, type ConfirmDialogProps } from "./overlays/ConfirmDialog";

// Disclosure & navigation-adjacent
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./disclosure/Tabs";
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./disclosure/Accordion";
export { Breadcrumb, type BreadcrumbItem } from "./disclosure/Breadcrumb";
export { Pagination, type PaginationProps } from "./disclosure/Pagination";

// Data
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from "./data/Table";
export { DataTable, type DataTableColumn, type DataTableProps } from "./data/DataTable";

// Media
export { Image, type ImageProps } from "./media/Image";
export { ImagePlaceholder } from "./media/ImagePlaceholder";

// Forms
export { Autocomplete, type AutocompleteOption, type AutocompleteProps } from "./forms/Autocomplete";
export { useZodForm } from "./forms/useZodForm";
export { FormError, type FormErrorProps } from "./forms/FormError";

// Upload
export { FileDropzone, type FileDropzoneProps } from "./upload/FileDropzone";
export { UploadProgressItem, type UploadProgressItemProps } from "./upload/UploadProgressItem";
export { ImagePreviewGrid, type ImagePreviewGridItem, type ImagePreviewGridProps } from "./upload/ImagePreviewGrid";

// Search
export { SearchProvider, useSearchContext, type SearchProviderProps, type SearchContextValue } from "./search/SearchProvider";
export { RecentSearchesList, type RecentSearchesListProps } from "./search/RecentSearchesList";
export { CommandPalette, type CommandPaletteItem, type CommandPaletteProps } from "./search/CommandPalette";

// Notifications
export {
  NotificationProvider,
  useNotifications,
  type AppNotification,
  type NotificationContextValue,
} from "./notifications/NotificationProvider";
export { NotificationCenter, type NotificationCenterProps } from "./notifications/NotificationCenter";
export {
  NotificationPreferences,
  type NotificationPreferenceItem,
  type NotificationPreferencesProps,
} from "./notifications/NotificationPreferences";

// Hooks
export * from "./hooks";

// Composed
export { ProductCard } from "./composed/ProductCard";
export { WishlistButton, type WishlistButtonProps } from "./composed/WishlistButton";
export { AnalyticsCard, type AnalyticsCardProps } from "./composed/AnalyticsCard";

// Navigation
export { Navbar, type NavbarProps, type NavAccountSummary } from "./navigation/Navbar";
export { BottomNav } from "./navigation/BottomNav";
export { Footer } from "./navigation/Footer";
export { Sidebar, type SidebarProps, type SidebarNavItem } from "./navigation/Sidebar";
