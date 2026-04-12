import useInView from "@/hooks/useInView";

export default function FadeInSection({ children, delay = 0 }: any) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
