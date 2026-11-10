import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

const MAX_WIDTH = 1600;

// Abre a câmera ou a galeria. Retorna null se o usuário cancelar.
export async function pickReceiptImage(
  source: 'camera' | 'library',
): Promise<PickedImage | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error(
        'Permita o acesso à câmera nos ajustes do celular para fotografar.',
      );
    }
  }

  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled) return null;
  const { uri, width, height } = result.assets[0];
  return { uri, width, height };
}

// Reduz a foto (no máx. 1600 px de largura) e devolve o JPEG em base64.
// Fotos menores que isso não são ampliadas.
export async function prepareForUpload(image: PickedImage): Promise<string> {
  const context = ImageManipulator.manipulate(image.uri);
  if (image.width > MAX_WIDTH) context.resize({ width: MAX_WIDTH });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.7,
    base64: true,
  });
  if (!saved.base64) throw new Error('Não foi possível preparar a imagem.');
  return saved.base64;
}
