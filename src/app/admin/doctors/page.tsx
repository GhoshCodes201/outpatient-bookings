import { CreateDoctorForm } from "@/components/admin/create-doctor-form";
import { toggleDoctorActiveAction } from "@/actions/doctors";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllDoctors } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const params = await searchParams;
  const doctors = await getAllDoctors();

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">Doctors</p>
        <h1 className="text-3xl font-semibold">Doctor accounts</h1>
        <p className="text-muted-foreground">Create login accounts and control who appears in the public directory.</p>
      </div>

      {params.updated ? (
        <Alert variant="success" className="mb-6">
          <AlertDescription>Doctor status updated.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Add a doctor</CardTitle>
            <CardDescription>A Better Auth account is created with the doctor role.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateDoctorForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All doctors</CardTitle>
            <CardDescription>{doctors.length} doctor records.</CardDescription>
          </CardHeader>
          <CardContent>
            {doctors.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No doctors yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell>
                        <p className="font-medium">{doctor.name}</p>
                        <p className="text-xs text-muted-foreground">{doctor.email ?? "No login linked"}</p>
                      </TableCell>
                      <TableCell>{doctor.specialization}</TableCell>
                      <TableCell>
                        <Badge variant={doctor.isActive ? "success" : "destructive"}>
                          {doctor.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <form action={toggleDoctorActiveAction}>
                          <input type="hidden" name="doctorId" value={doctor.id} />
                          <input type="hidden" name="isActive" value={doctor.isActive ? "false" : "true"} />
                          <Button type="submit" variant="outline" size="sm">
                            {doctor.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
