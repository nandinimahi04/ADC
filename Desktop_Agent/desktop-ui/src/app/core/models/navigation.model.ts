/**
 * Represents an item displayed in the application sidebar.
 */
export interface NavigationItem {

  /**
   * Display name of the navigation item.
   */
  label: string;

  /**
   * Angular route associated with the item.
   */
  route: string;

  /**
   * Icon used by the navigation item.
   */
  icon: any;

  /**
   * Tooltip displayed when the sidebar is collapsed.
   */
  tooltip?: string;
}