export default function PlanBanner() {
  return (
    <div className="text-xs tracking-wider flex items-center justify-center gap-2">
      <span className="text-gray-500">Free plan</span>
      <span className="text-gray-600">·</span>
      <a 
        href="#" 
        className="text-gray-100 underline underline-offset-2 hover:text-white 
                   transition-colors duration-200"
      >
        Upgrade
      </a>
    </div>
  );
}