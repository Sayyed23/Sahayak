import { cn } from "@/lib/utils"

export const Logo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      {...props}
    >
      <circle cx="24" cy="24" r="22" className="fill-primary/10" />
      <path d="M14 34V14h7c2.761 0 5 2.239 5 5s-2.239 5-5 5h-7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary" />
      <path d="M26 24h5c2.761 0 5 2.239 5 5s-2.239 5-5 5h-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary" />
    </svg>
  )
}
