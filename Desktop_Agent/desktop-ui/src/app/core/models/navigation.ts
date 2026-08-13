/**
 * Represents a sidebar navigation item.
 */
export interface NavigationItem {

  /**
   * Text displayed to the user.
   */
  label: string;

  /**
   * Angular route.
   */
  route: string;

  /**
   * Icon used by the navigation item.
   */
  icon: any;

  /**
   * Tooltip shown when sidebar is collapsed.
   */
  tooltip?: string;
}