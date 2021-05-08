import { useEffect, useState } from "react";
import { useCamera } from '@ionic/react-hooks/camera';
import { useFilesystem, base64FromPath } from '@ionic/react-hooks/filesystem';
/* necessário acrescentar */
import { useStorage } from '@ionic/react-hooks/storage';
import { CameraResultType, CameraSource, CameraPhoto, FilesystemDirectory } from "@capacitor/core";

const PHOTO_STORAGE = "photos";

/* Esse componente é responsável por fazer a conexão da 
câmera com a aplicação.*/
export function usePhotoGallery() {

  /* ganha acesso aos métodos do hoodk useFilesystem */  
  const { deleteFile, getUri, readFile, writeFile } = useFilesystem();
  
  /* ---- Carregando os arquivos ---- */ 
  const { get, set } = useStorage();

  const { getPhoto } = useCamera();

  /* armazena o array de fotos capturadas pela câmera */
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    const loadSaved = async () => {
      const photosString = await get(PHOTO_STORAGE);
      const photos = (photosString ? JSON.parse(photosString) : []) as Photo[];
      for (let photo of photos) {
        const file = await readFile({
          path: photo.filepath,
          directory: FilesystemDirectory.Data
        });
        photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
      }
      setPhotos(photos);
    };
    loadSaved();
  }, [get, readFile]);
  
  const takePhoto = async () => {
    const cameraPhoto = await getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    /* Para não sobrescrever o arquivo já existente, vamos criar um novo objeto pra armazenar a foto,
     acrescentando o horário que a foto foi tirada ao nome do arquivo */
    const fileName = new Date().getTime() + '.jpeg';
    const savedFileImage = await savePicture(cameraPhoto, fileName);
    const newPhotos = [savedFileImage, ...photos];
    setPhotos(newPhotos)

    set(PHOTO_STORAGE, JSON.stringify(newPhotos));
  };

  /*método responsável por salvar as fotos no disco */
  const savePicture = async (photo: CameraPhoto, fileName: string): Promise<Photo> => {
    
    /* Converte a foto para o formato base64 */
    const base64Data = await base64FromPath(photo.webPath!);
    const savedFile = await writeFile({
      path: fileName,
      data: base64Data,
      directory: FilesystemDirectory.Data
    });
  
    // Use webPath to display the new image instead of base64 since it's
    // already loaded into memory
    return {
      filepath: fileName,
      webviewPath: photo.webPath
    };
  };

  return {
    photos,
    takePhoto
  };
}

/* Cria um novo tipo de dado chamado Photo para armazenar a foto no aplicativo */
export interface Photo {
  filepath: string;
  /* parâmetro opcional */
  webviewPath?: string;
}