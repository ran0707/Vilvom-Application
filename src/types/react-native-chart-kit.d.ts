// Minimal module declaration for react-native-chart-kit
// Place this file under src/types so TypeScript picks it up.
declare module 'react-native-chart-kit' {
  import { ComponentType } from 'react';
  export const LineChart: ComponentType<any>;
  export const BarChart: ComponentType<any>;
  export const ContributionGraph: ComponentType<any>;
  export const StackedBarChart: ComponentType<any>;
  export const PieChart: ComponentType<any>;
  export const ProgressChart: ComponentType<any>;
  const _default: {
    LineChart: ComponentType<any>;
    BarChart: ComponentType<any>;
    ContributionGraph: ComponentType<any>;
    StackedBarChart: ComponentType<any>;
    PieChart: ComponentType<any>;
    ProgressChart: ComponentType<any>;
  };
  export default _default;
}
