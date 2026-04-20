    /* ─── useMediaQuery: reactive breakpoint hook ─── */
    const useMediaQuery = (query) => {
      const [matches, setMatches] = React.useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(query).matches : false
      );
      React.useEffect(() => {
        const mql = window.matchMedia(query);
        const onChange = (e) => setMatches(e.matches);
        mql.addEventListener ? mql.addEventListener('change', onChange) : mql.addListener(onChange);
        setMatches(mql.matches);
        return () => {
          mql.removeEventListener ? mql.removeEventListener('change', onChange) : mql.removeListener(onChange);
        };
      }, [query]);
      return matches;
    };

    // Preset: true on touch devices / phones (<768px)
    const useIsMobile = () => useMediaQuery('(max-width: 767px)');
    // Preset: coarse pointer (real touch, vs hover-capable mouse)
    const useIsTouch  = () => useMediaQuery('(hover: none) and (pointer: coarse)');
