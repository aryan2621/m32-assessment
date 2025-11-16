import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "@/api/settings";
import { Loader2, CheckCircle2, XCircle, ExternalLink, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [syncProgress, setSyncProgress] = useState<{
    progress: number;
    message: string;
    isSyncing: boolean;
  }>({
    progress: 0,
    message: '',
    isSyncing: false,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getSettings,
  });

  const disconnectMutation = useMutation({
    mutationFn: settingsApi.disconnectGoogleDrive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Google Drive disconnected successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to disconnect Google Drive');
    },
  });

  const handleSyncAll = async () => {
    setSyncProgress({
      progress: 0,
      message: 'Starting sync...',
      isSyncing: true,
    });

    try {
      await settingsApi.syncAllInvoices((event) => {
        setSyncProgress({
          progress: event.progress || 0,
          message: event.message,
          isSyncing: true,
        });

        if (event.type === 'sync_error') {
          toast.error(event.message);
        } else if (event.type === 'synced') {
          toast.success(event.message);
        }
      });

      setSyncProgress({
        progress: 100,
        message: 'Sync completed successfully',
        isSyncing: false,
      });

      toast.success('All invoices synced to Google Drive successfully');
    } catch (error: any) {
      setSyncProgress({
        progress: 0,
        message: error.message || 'Sync failed',
        isSyncing: false,
      });
      toast.error(error.message || 'Failed to sync invoices to Google Drive');
    }
  };

  const handleConnect = async () => {
    try {
      const authUrl = await settingsApi.initiateGoogleDriveAuth();
      window.location.href = authUrl;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate Google Drive connection');
    }
  };

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      toast.success('Google Drive connected successfully!');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSearchParams({});
    } else if (error === 'connection_failed') {
      toast.error('Failed to connect Google Drive. Please try again.');
      setSearchParams({});
    }
  }, [searchParams, queryClient, setSearchParams]);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your integrations and preferences</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Google Drive Integration
                </CardTitle>
                <CardDescription className="mt-1">
                  Connect your Google Drive account to automatically sync invoices to a custom folder
                </CardDescription>
              </div>
              {settings?.googleDrive?.isConnected && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : settings?.googleDrive?.isConnected ? (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Folder Name</p>
                      <p className="text-sm text-muted-foreground">
                        {settings.googleDrive.folderName || 'expenses'}
                      </p>
                    </div>
                  </div>
                  {settings.googleDrive.connectedAt && (
                    <div>
                      <p className="text-sm font-medium">Connected At</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(settings.googleDrive.connectedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSyncAll}
                    disabled={syncProgress.isSyncing || disconnectMutation.isPending}
                  >
                    {syncProgress.isSyncing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Sync All Invoices
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending || syncProgress.isSyncing}
                  >
                    {disconnectMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Disconnect
                      </>
                    )}
                  </Button>
                </div>
                {syncProgress.isSyncing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{syncProgress.message}</span>
                      <span className="text-muted-foreground">{syncProgress.progress}%</span>
                    </div>
                    <Progress value={syncProgress.progress} />
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  New invoices will be automatically synced to your Google Drive folder. Use "Sync All Invoices" to sync existing invoices.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Google Drive is not connected. Connect your account to enable automatic invoice syncing.
                  </p>
                  <Button onClick={handleConnect}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Connect Google Drive
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

