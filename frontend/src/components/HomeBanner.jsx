
import { useState } from "react";

const banners = [
  "/images/mobile-banner.png",
  "/images/mobile-banner.png",
  "/images/mobile-banner.png",
];

export default function HomeBanner() {
  const [active, setActive] = useState(0);

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="relative overflow-hidden">
        <img
          src={banners[active]}
          alt="Latest smartphones promotional banner"
          className="block aspect-[2/1] w-full object-cover sm:aspect-[3/1]"
        />

        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-gradient-to-t from-black/20 to-transparent pb-3 pt-6">
          {banners.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show banner ${index + 1}`}
              onClick={() => setActive(index)}
              className={`h-2 rounded-full transition-all ${
                active === index
                  ? "w-7 bg-white"
                  : "w-2 bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
