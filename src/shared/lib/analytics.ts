// Google Analytics event tracking helpers

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID || ''

// Types for events
type EventParams = {
  action: string
  category: string
  label?: string
  value?: number
}

// Generic event
export const event = ({ action, category, label, value }: EventParams) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Specific events for SealDrop
export const trackModalOpen = () => {
  event({
    action: 'modal_open',
    category: 'engagement',
    label: 'waitlist_modal',
  })
}

export const trackWaitlistSubmit = (hasComments: boolean) => {
  event({
    action: 'waitlist_submit',
    category: 'conversion',
    label: hasComments ? 'with_comments' : 'without_comments',
  })
}

export const trackCTAClick = (location: string) => {
  event({
    action: 'cta_click',
    category: 'engagement',
    label: location, // 'hero', 'problem_section', 'final'
  })
}

export const trackScreenshotClick = (screenshotName: string) => {
  event({
    action: 'screenshot_click',
    category: 'engagement',
    label: screenshotName,
  })
}

export const trackScrollDepth = (percentage: number) => {
  event({
    action: 'scroll_depth',
    category: 'engagement',
    label: `${percentage}%`,
    value: percentage,
  })
}
