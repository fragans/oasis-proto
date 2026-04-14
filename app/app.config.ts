export default defineAppConfig({
  ui: {
    colors: {
      primary: 'indigo',
      neutral: 'zinc'
    },
    input: {
      slots: {
        root: 'w-full'
      }
    },
    textarea: {
      slots: {
        root: 'w-full'
      }
    },
    select: {
      slots: {
        base: 'w-full'
      }
    }
  }
})
