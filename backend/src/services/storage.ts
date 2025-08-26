import { GeneratedImage, GeneratedVideo} from '@/types/generation';

type jsonType = "image_to_video" | "text_to_image"
type jsonResultType = GeneratedVideo[] | GeneratedImage[]

const getTypeFromJson = async (
  type: jsonType,
  jsonPath: string = JSON_PATH
): Promise<jsonResultType> => {
  try {
    const fileContent = await fs.readFile(jsonPath, "utf8");
    const data = JSON.parse(fileContent);
    return data || [];
  } catch (err) {
    console.error(`加载 ${type} 类型数据失败:`, err);
    return []; // 出错时返回空数组，避免调用方报错
  }
};