import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function EmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quote not found in this session</CardTitle>
        <CardDescription>
          Quotes are kept in your browser tab while you issue a policy. If you opened this URL
          fresh or closed the tab earlier, we don't have it anymore.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/">Start a new quote</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
