import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  FileCheck,
  Search,
  Download,
  Eye,
  Scale,
  Calendar,
  Leaf,
  Award,
} from 'lucide-react';
import recyclerService from '@/services/recyclerService';
import { RecyclingCertificate } from '@/types';

export default function RecyclerCertificates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<RecyclingCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCert, setSelectedCert] = useState<RecyclingCertificate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadData();
      const id = window.setInterval(loadData, 20_000);
      return () => window.clearInterval(id);
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const certsData = await recyclerService.getCertificates(user.id);
      setCertificates(certsData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (cert: RecyclingCertificate) => {
    try {
      toast({
        title: "Download Started",
        description: "Certificate PDF is being generated...",
      });
      
      await recyclerService.downloadCertificate(cert.id);
      
      toast({
        title: "Download Complete",
        description: `Certificate ${cert.id}.pdf has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const openPreview = (cert: RecyclingCertificate) => {
    setSelectedCert(cert);
    setPreviewOpen(true);
  };

  const filteredCertificates = certificates.filter(cert =>
    // FIX: guard against undefined id before calling toLowerCase
    (cert.id ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recycling Certificates</h1>
          <p className="text-muted-foreground">View your recycling certificates (auto-generated on completion)</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by certificate ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Certificates List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCertificates.length > 0 ? (
          filteredCertificates.map((cert) => (
            <Card key={cert.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="rounded-full bg-success/10 p-2">
                    <Award className="h-5 w-5 text-success" />
                  </div>
                  <Badge variant="outline" className="bg-success/10 text-success">
                    Valid
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-3">{cert.id}</CardTitle>
                <CardDescription>
                  Issued to pickup #{cert.pickupId?.slice(-8) || 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    <span>{cert.totalWeight || 0} kg recycled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-success" />
                    <span className="text-success">
                      {cert.co2Saved != null ? `${cert.co2Saved} kg` : `${Math.round((cert.totalWeight || 0) * 0.5)} kg`} CO₂ saved
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openPreview(cert)}>
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button size="sm" className="flex-1" onClick={() => handleDownload(cert)}>
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="py-12 text-center">
              <FileCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No certificates generated yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Certificates are automatically created when you complete recycling.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Certificate Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Certificate Preview</DialogTitle>
          </DialogHeader>
          
          {selectedCert && (
            <div className="border-2 border-primary rounded-lg p-6 bg-gradient-to-br from-primary/5 to-success/5">
              <div className="text-center mb-6">
                <div className="inline-block p-3 bg-primary/10 rounded-full mb-3">
                  <Award className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold">E-Waste Recycling Certificate</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Certificate ID: {selectedCert.id}
                </p>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-muted-foreground">Total Weight</p>
                    <p className="font-medium">{selectedCert.totalWeight || 0} kg</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg">
                    <p className="text-muted-foreground">CO₂ Saved</p>
                    <p className="font-medium text-success">
                      {selectedCert.co2Saved != null ? `${selectedCert.co2Saved} kg` : `${Math.round((selectedCert.totalWeight || 0) * 0.5)} kg`}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 bg-background rounded-lg">
                  <p className="text-muted-foreground">Pickup ID</p>
                  <p className="font-medium">{selectedCert.pickupId || 'N/A'}</p>
                </div>
                
                <div className="p-3 bg-background rounded-lg">
                  <p className="text-muted-foreground">Issue Date</p>
                  <p className="font-medium">
                    {selectedCert.issuedAt ? new Date(selectedCert.issuedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  This certificate confirms that the above e-waste items have been properly recycled
                  in accordance with environmental regulations.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            {selectedCert && (
              <Button onClick={() => handleDownload(selectedCert)}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
