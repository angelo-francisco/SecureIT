import bgVideo from "../assets/bg1.mp4";

export function BackgroundVideo() {
  return (
    <>
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0"
      >
        <source src={bgVideo} type="video/mp4" />
      </video>
      <div className="fixed inset-0 z-[1] bg-black/10" />
    </>
  );
}
