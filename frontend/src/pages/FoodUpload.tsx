import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ExternalBlob } from '@/backend';
import { estimateCalories } from '@/utils/calorieEstimator';
import { useAddFoodEntry } from '@/hooks/useQueries';
import ImageDropzone from '@/components/ImageDropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Flame,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info,
  Utensils,
  Sparkles,
} from 'lucide-react';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

type UploadStep = 'select' | 'review' | 'success';

export default function FoodUpload() {
  const navigate = useNavigate();
  const addFoodEntry = useAddFoodEntry();

  const [step, setStep] = useState<UploadStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [calorieRange, setCalorieRange] = useState<[number, number]>([0, 0]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const handleFileSelected = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Estimate calories
    const estimate = estimateCalories(file);
    setFoodName(estimate.suggestedFoodName);
    setCalories(String(estimate.estimatedCalories));
    setCalorieRange(estimate.calorieRange);

    setStep('review');
  }, []);

  const handleClear = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFoodName('');
    setCalories('');
    setCalorieRange([0, 0]);
    setStep('select');
    setError(null);
    setUploadProgress(0);
  }, [previewUrl]);

  const handleConfirm = async () => {
    if (!selectedFile || !foodName.trim() || !calories) return;

    const calorieNum = parseInt(calories, 10);
    if (isNaN(calorieNum) || calorieNum < 0) {
      setError('Please enter a valid calorie amount.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Read file as bytes
      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Create ExternalBlob with progress tracking
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });

      await addFoodEntry.mutateAsync({
        date: selectedDate,
        foodName: foodName.trim(),
        calories: BigInt(calorieNum),
        image: blob,
      });

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save food entry. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Card className="border border-success/30 bg-success/5 rounded-2xl">
          <CardContent className="flex flex-col items-center py-12 gap-4">
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">Logged!</h2>
              <p className="text-muted-foreground mt-1">
                <span className="font-semibold text-foreground">{foodName}</span> has been added to your log for {selectedDate}.
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge className="bg-accent/20 text-accent-foreground border-accent/30 text-base px-3 py-1">
                  <Flame className="w-4 h-4 mr-1" />
                  {calories} kcal
                </Badge>
              </div>
            </div>
            <div className="flex gap-3 mt-2 w-full">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => {
                  handleClear();
                  setStep('select');
                }}
              >
                Log Another
              </Button>
              <Button
                className="flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => navigate({ to: '/dashboard' })}
              >
                View Dashboard
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Utensils className="w-6 h-6 text-primary" />
          Log Food
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload a photo of your meal to estimate and log its calories.
        </p>
      </div>

      {/* Date Selector */}
      <Card className="border border-border rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="log-date" className="text-sm font-medium whitespace-nowrap">Log for date:</Label>
            <Input
              id="log-date"
              type="date"
              value={selectedDate}
              max={getTodayDate()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Image Upload */}
      <Card className="border border-border rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-foreground" />
            Food Photo
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ImageDropzone
            onFileSelected={handleFileSelected}
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            onClear={handleClear}
          />
        </CardContent>
      </Card>

      {/* Review & Edit */}
      {step === 'review' && (
        <>
          {/* Calorie Estimate Info */}
          <Alert className="rounded-2xl border-primary/30 bg-primary/5">
            <Info className="w-4 h-4 text-primary" />
            <AlertDescription className="text-sm text-foreground">
              <span className="font-semibold">Estimated range:</span>{' '}
              {calorieRange[0]}–{calorieRange[1]} kcal based on food type. You can adjust below.
            </AlertDescription>
          </Alert>

          {/* Edit Fields */}
          <Card className="border border-border rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Confirm Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="food-name">Food Name</Label>
                <Input
                  id="food-name"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g. Grilled Chicken Salad"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calories" className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-accent-foreground" />
                  Calories (kcal)
                </Label>
                <Input
                  id="calories"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="e.g. 350"
                  className="rounded-xl"
                  min="0"
                  max="5000"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Upload Progress */}
              {isUploading && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Uploading image...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 h-11"
                onClick={handleConfirm}
                disabled={isUploading || !foodName.trim() || !calories}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Save to Log
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {step === 'select' && (
        <p className="text-center text-sm text-muted-foreground">
          Upload a photo to get an automatic calorie estimate
        </p>
      )}
    </div>
  );
}
