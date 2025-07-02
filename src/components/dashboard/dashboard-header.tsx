
"use client"
import { HelpCircle, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { useTranslation } from '@/hooks/use-translation'

export function DashboardHeader() {
  const { t, setLanguage } = useTranslation()
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>

      <div className="flex w-full items-center justify-end gap-2 md:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Globe className="h-5 w-5" />
              <span className="sr-only">{t("Select language")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage('english')}>English</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('hindi')}>Hindi</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('bengali')}>Bengali</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('marathi')}>Marathi</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                        <HelpCircle className="h-5 w-5" />
                        <span className="sr-only">{t("Help")}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t("Get help and support")}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  )
}
