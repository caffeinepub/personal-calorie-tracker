import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, CheckCircle2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageDropzone from "../components/ImageDropzone";
import { useAddFoodEntry } from "../hooks/useQueries";
import { estimateCaloriesFromFile, guessFoodNameFromFile } from "../utils/calorieEstimator";
import { ExternalBlob } from "../backend";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function FoodUpload() {
  const navigate = useNavigate();
  const addFoodEntry = useAddFoodEntry();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleImageSelected = useCallback((file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFoodName(guessFoodNameFromFile(file));
    setCalories(estimateCaloriesFromFile(file));
    setIsSuccess(false);
  }, []);

  const handleImageCleared = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFoodName("");
    setCalories(0);
    setIsSuccess(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !foodName.trim() || calories <= 0) return;

    try {
      const bytes = new Uint8Array(await selectedFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setUploadProgress(pct);
      });

      const today = new Date().toISOString().split("T")[0];
      const id = generateId();

      await addFoodEntry.mutateAsync({
        id,
        date: today,
        foodName: foodName.trim(),
        calories: BigInt(Math.round(calories)),
        image: blob,
      });

      setIsSuccess(true);
      setUploadProgress(0);
    } catch (err) {
      console.error("Failed to add food entry:", err);
      setUploadProgress(0);
    }
  };

  const handleLogAnother = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFoodName("");
    setCalories(0);
    setIsSuccess(false);
    setUploadProgress(0);
  };

  if (isSuccess) {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <CheckCircle2 className="w-16 h-16 text-success" />
            <h2 className="text-xl font-bold">Food Logged!</h2>
            <p className="text-muted-foreground text-center">
              <strong>{foodName}</strong> ({calories} kcal) has been added to today's log.
            </p>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={handleLogAnother}>
                Log Another
              </Button>
              <Button onClick={() => navigate({ to: "/dashboard" })}>
                View Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSubmitting = addFoodEntry.isPending;
  const canSubmit = !!selectedFile && foodName.trim().length > 0 && calories > 0 && !isSubmitting;

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Utensils className="w-6 h-6 text-primary" />
          Log Food
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload a photo of your meal to log it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meal Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <ImageDropzone
              onImageSelected={handleImageSelected}
              onImageCleared={handleImageCleared}
              previewUrl={previewUrl}
            />

            {selectedFile && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="foodName">Food Name</Label>
                  <Input
                    id="foodName"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder="e.g. Grilled Chicken Salad"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="calories">Estimated Calories (kcal)</Label>
                  <Input
                    id="calories"
                    type="number"
                    min={1}
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    disabled={isSubmitting}
                  />
                </div>

                {isSubmitting && uploadProgress > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading…</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={!canSubmit}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save Entry"
                  )}
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
