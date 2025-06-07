import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useChecklistImages() {
  const { toast } = useToast();

  const uploadImagesToSupabase = async (inspectionId: string, files: File[]): Promise<string[]> => {
    const imagePaths: string[] = [];

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${inspectionId}/${Date.now()}.${fileExt}`;
        const { error } = await supabase.storage
          .from('checklist-images')
          .upload(fileName, file);

        if (error) {
          console.error('Error uploading image:', { fileName, error });
          toast({
            title: "Error",
            description: `Failed to upload image: ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        const { data } = supabase.storage
          .from('checklist-images')
          .getPublicUrl(fileName);

        if (data?.publicUrl) {
          imagePaths.push(data.publicUrl);
        } else {
          console.error('Failed to get public URL for:', fileName);
        }
      }

      console.log('Image upload result:', imagePaths);
      return imagePaths;
    } catch (error) {
      console.error('Error in uploadImagesToSupabase:', error);
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
      return [];
    }
  };

  return { uploadImagesToSupabase };
}