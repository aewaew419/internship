# Responsive Chart Components

This directory contains mobile-first responsive chart components built for the Next.js internship management system.

## Components

### DonutChart

A responsive donut chart component with mobile-optimized features.

#### Features

- **Responsive Sizing**: Automatically adjusts padding, font sizes, and touch targets based on screen size
- **Touch Interactions**: Enhanced touch support with haptic feedback on mobile devices
- **Mobile Optimizations**: 
  - Larger touch targets for mobile interactions
  - Optimized tooltips positioning
  - Responsive data label display
  - Touch-friendly hover states

#### Props

```typescript
interface DonutChartProps {
  data?: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
    }[];
  };
  className?: string;
  enableTouch?: boolean; // Default: true
}
```

#### Usage

```tsx
import { DonutChart } from '@/components/charts';

const chartData = {
  labels: ["เอกสารผ่านแล้ว", "รอการพิจารณา", "กำลังเลือกบริษัท"],
  datasets: [{
    data: [60, 20, 20],
    backgroundColor: ["#344BFD", "#F4A79D", "#F68D2B"],
  }],
};

<DonutChart 
  data={chartData} 
  enableTouch={true}
  className="my-custom-class"
/>
```

### ResponsiveChart

A container component that provides responsive sizing and mobile-specific features for charts.

#### Features

- **Responsive Dimensions**: Automatically adjusts size based on device type
- **Fullscreen Support**: Mobile fullscreen viewing capability
- **Touch Indicators**: Visual indicators for mobile users
- **Container Optimization**: Proper aspect ratio and sizing constraints

#### Props

```typescript
interface ResponsiveChartProps {
  children: ReactNode;
  className?: string;
  minHeight?: number; // Default: 200
  maxHeight?: number; // Default: 500
  aspectRatio?: number; // Default: 1 (1:1 for donut charts)
  enableFullscreen?: boolean; // Default: false
}
```

#### Usage

```tsx
import { ResponsiveChart, DonutChart } from '@/components/charts';

<ResponsiveChart 
  enableFullscreen={true}
  minHeight={150}
  maxHeight={400}
>
  <DonutChart data={chartData} enableTouch={true} />
</ResponsiveChart>
```

## Responsive Breakpoints

The components use the following breakpoints:

- **Mobile**: `max-width: 768px`
  - Smaller padding and font sizes
  - Enhanced touch targets
  - Fullscreen capability
  - Touch indicators

- **Tablet**: `min-width: 769px and max-width: 1023px`
  - Medium sizing
  - Balanced touch and mouse interactions

- **Desktop**: `min-width: 1024px`
  - Full sizing and features
  - Mouse-optimized interactions

## Mobile-Specific Features

### Touch Interactions

- **Enhanced Touch Targets**: Larger hover areas and touch zones
- **Haptic Feedback**: Vibration feedback on supported devices
- **Touch Prevention**: Prevents page scrolling during chart interaction
- **Optimized Tooltips**: Better positioning and sizing for mobile

### Fullscreen Mode

- Available on mobile devices when `enableFullscreen={true}`
- Provides immersive chart viewing experience
- Touch-friendly exit controls

### Performance Optimizations

- **Responsive Options**: Chart.js options are dynamically generated based on screen size
- **Efficient Re-renders**: Uses React hooks to minimize unnecessary re-renders
- **Memory Management**: Proper cleanup of event listeners and observers

## Integration with Dashboard

The charts are integrated into the dashboard with mobile-first responsive design:

```tsx
// In app/page.tsx
<ResponsiveChart 
  enableFullscreen={true}
  className="mx-auto"
>
  <DonutChart 
    data={chartData} 
    enableTouch={true}
  />
</ResponsiveChart>
```

## Testing

The components include comprehensive tests covering:

- Responsive behavior across different screen sizes
- Touch interaction functionality
- Fullscreen capabilities
- Proper prop handling and defaults

Run tests with:
```bash
npm test -- --testPathPattern=charts
```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **Requirement 2.5**: Charts and graphs are responsive and readable on small screens
- **Requirement 3.2**: Components maintain identical visual appearance and behavior across devices
- **Touch Interactions**: Enhanced mobile chart viewing with touch support
- **Responsive Sizing**: Charts adapt to screen size automatically
- **Mobile Optimization**: Specific optimizations for mobile devices

## Browser Support

- Modern browsers with ES6+ support
- Mobile Safari (iOS 12+)
- Chrome Mobile (Android 8+)
- Desktop browsers (Chrome, Firefox, Safari, Edge)

## Dependencies

- `react-chartjs-2`: Chart.js React wrapper
- `chart.js`: Core charting library
- `chartjs-plugin-datalabels`: Data labels plugin
- Custom hooks: `useIsMobile`, `useIsTablet`, `useIsDesktop`