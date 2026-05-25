"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { EditUserRatesDialog } from "@/components/edit-user-rates-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateUserRole } from "@/hooks/use-update-user-role";
import type { UserListItem, UserRole } from "@/lib/types";

const ROLES: UserRole[] = ["ADMIN", "STAFF", "USER"];

export function UserRowActions({
  user,
  isSelf,
}: {
  user: UserListItem;
  isSelf: boolean;
}) {
  const mutation = useUpdateUserRole();
  const [ratesOpen, setRatesOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open actions">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setRatesOpen(true)}>
              Edit rates
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={isSelf || mutation.isPending}>
                Change role
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={user.role}
                  onValueChange={(role) => {
                    if (role === user.role) return;
                    mutation.mutate({ id: user.id, role: role as UserRole });
                  }}
                >
                  {ROLES.map((r) => (
                    <DropdownMenuRadioItem key={r} value={r}>
                      {r}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <EditUserRatesDialog user={user} open={ratesOpen} onOpenChange={setRatesOpen} />
    </>
  );
}
