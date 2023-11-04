// Arquivo de definição de tipos

import 'styled-components'
import { defaultTheme } from '../styles/themes/default'

type ThemeType = typeof defaultTheme

/*
  Criando uma tipagem para o módulo styled-components. Com isso, toda vez que o styled components for importado em algum arquivo, a definição de tipos que ele irá puxar será a que foi definida abaixo:
*/
declare module 'styled-components' {
  export interface DefaultTheme extends ThemeType {}
}
