//  src/components/ui/PlanBanner.jsx
export default function PlanBanner() {
  return (
    <div className="text-xs tracking-wider flex items-center justify-center gap-2">
      <span className="text-gray-500">Follow me on Instagram</span>
      <span className="text-gray-600">·</span>
      <a 
        href="https://www.instagram.com/nitin__bhujwa/" 
        className="text-gray-100 underline underline-offset-2 hover:text-white 
                   transition-colors duration-200"
      >
        Nitin Bhujwa
      </a>
    </div>
  );
}