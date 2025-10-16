export function dateToStr(date: string | Date){
  try{
    return new Date(date).toLocaleDateString('ru-RU')
  } catch (e) {
    return date
  }
}