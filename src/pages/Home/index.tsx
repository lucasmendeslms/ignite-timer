import { HandPalm, Play } from 'phosphor-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import * as zod from 'zod'
import { differenceInSeconds } from 'date-fns'

import {
  CountdownContainer,
  FormContainer,
  HomeContainer,
  MinutesAmountInput,
  Separator,
  StartCountdownButton,
  StopCountdownButton,
  TaskInput,
} from './styles'

/*
  Formulários podem ser do tipo controlled (pega o input do usuário enquanto ele digita) 
  e uncontrolled (pega o input do usuário apenas quando ele envia o formulário)
*/

/*
  O register do react-hook-form é uma função que traz todos os métodos utilizados para controlar um formulário

  Ex de como ela funciona:

  function register (name: string) {
    return {
      onChange: () => void,
      onBlur: () => void,
      onFocus: () => void,
    }
  }

  Podemos ver todos os métodos presentes em register com " register('task'). "

  Quando utilizamos o spread operator "{...register('task')}" queremos que cada um dos métodos dentro da função register seja uma propriedade do input, como se estivéssemos colocando todas elas abaixo do placeholder.

  Ex: 
    <TaskInput
      id="task"
      list="task-suggestions"
      placeholder="Dê um nome para o seu projeto"
      onChange={...},
      onFocus={...},
      onBlur={...}      
    />

*/

const newCycleFormValidationSchema = zod.object({
  task: zod.string().min(1, 'Informe a tarefa'),
  minutesAmount: zod
    .number()
    .min(5, 'O ciclo precisa ser de no mínimo 5 minutos')
    .max(60, 'O ciclo precisa ser de no máximo 60 minutos'),
})

/*
  Fazendo a mesma coisa utilizando o zod. Por preferência, "interface" é utiliza quando vamos definir o objeto de validação e "type" quando vamos criar uma tipagem (algo do typescript) a partir de outra referência, como por exemplo uma variável
*/
// interface NewCycleFormData {
//   task: string
//   minutesAmount: number
// }

/*
  O TypeScript não consegue entender uma variável JavaScript, por isso precisamos utilizar o "typeof" sempre que queremos referenciar uma variável JS dentro do TS
*/
type NewCycleFormData = zod.infer<typeof newCycleFormValidationSchema>

interface Cycle {
  id: string
  task: string
  minutesAmount: number
  startDate: Date
  interruptedDate?: Date
  finishedDate?: Date
}

export function Home() {
  /*
    O estado é a única forma de armazenar no componente uma informação que será responsável por alterar a interface de alguma forma.

    Observação: É importante sempre iniciar o estado com alguma informação do mesmo tipo da informação que será manuseada pelo useState. No nosso caso, por exemplo, como é uma lista de Cycles precisamos iniciar com uma lista vazia.
  */
  const [cycles, setCycles] = useState<Cycle[]>([])

  // Uma forma de mantermos a informação de qual item está ativo no momento sem ter que setar uma propriedade do tipo "isActive = true" e ter a necessidade de percorrer toda a lista para definir como false os itens que não estão ativos é utilizando um estado para armazenar o ID do ciclo ativo.
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null)

  const [amountSecondsPassed, setAmountSecondsPassed] = useState(0)

  // Criando a validação para o form passando um objeto que será utilizado para definir as configurações que tornam ele válido
  const { register, handleSubmit, watch, reset } = useForm<NewCycleFormData>({
    resolver: zodResolver(newCycleFormValidationSchema),
    defaultValues: {
      task: '',
      minutesAmount: 0,
    },
  })

  /* Para pegar o ciclo de tempo ativo podemos percorrer a lista de ciclos */
  const activeCycle = cycles.find((cycle) => cycle.id === activeCycleId)

  const totalSeconds = activeCycle ? activeCycle.minutesAmount * 60 : 0

  /* Como o setInterval pode ter atrasos na contagem devido a processamento da máquina ou outros fatores, utilizamos a biblioteca date-fns para calcular a diferença de tempo entre o horário que o ciclo foi criado e o horário atual, garantindo que o contador atualize a cada 1s */
  useEffect(() => {
    let interval: number

    if (activeCycle) {
      interval = setInterval(() => {
        const secondsDifference = differenceInSeconds(
          new Date(),
          activeCycle.startDate,
        )

        if (secondsDifference >= totalSeconds) {
          setCycles((state) =>
            state.map((cycle) => {
              if (cycle.id === activeCycleId) {
                return { ...cycle, finishedDate: new Date() }
              } else {
                return cycle
              }
            }),
          )

          setAmountSecondsPassed(totalSeconds)
          clearInterval(interval)
        } else {
          setAmountSecondsPassed(secondsDifference)
        }
      }, 1000)
    }

    /* Esse return do useEffect será sempre uma função que irá executar uma ação quando o useEffect for executado novamente. Neste caso, a ação é resetar o contador anterior */
    return () => {
      clearInterval(interval)
    }
  }, [activeCycle, totalSeconds, activeCycleId])

  function handleCreateNewCycle(data: NewCycleFormData) {
    const id = String(new Date().getTime())

    const newCycle: Cycle = {
      id,
      task: data.task,
      minutesAmount: data.minutesAmount,
      startDate: new Date(),
    }

    /* Sempre que precisarmos alterar um estado e esse estado depender da informação anterior dele, por exemplo, quando estamos adicionando um valor no final de um estado que já continha outras informações, é importante que esse valor do estado seja setado no formato de função (closures no react) */
    setCycles((state) => [...state, newCycle])
    setActiveCycleId(id)
    setAmountSecondsPassed(0)
    // O react-hook-form nos fornece essa função responsável por limpar o campos para o valor original que definimos no defaultValues dentro do useForm
    reset()
  }

  /* Aqui é necessário usar o .map pois precisaremos percorrer a lista de ciclos e adicionar uma nova propriedade no ciclo ativo que foi interrompido. Nesse caso, escrevemos essa atualização de setCycles no formato de função porque estamos atualizando a lista de ciclos e isso depende do valor anterior da lista (closures) */
  function handleInterruptCycle() {
    setCycles((state) =>
      state.map((cycle) => {
        if (cycle.id === activeCycleId) {
          return { ...cycle, interruptedDate: new Date() }
        } else {
          return cycle
        }
      }),
    )

    setActiveCycleId(null)
  }

  const currentSeconds = activeCycle ? totalSeconds - amountSecondsPassed : 0

  const minutesAmount = Math.floor(currentSeconds / 60)
  const secondsAmount = currentSeconds % 60

  const minutes = String(minutesAmount).padStart(2, '0')
  const seconds = String(secondsAmount).padStart(2, '0')

  useEffect(() => {
    if (activeCycle) {
      document.title = `${minutes}:${seconds}`
    }
  }, [minutes, seconds, activeCycle])

  const task = watch('task')
  const isSubmitDisabled = !task

  return (
    <HomeContainer>
      <form onSubmit={handleSubmit(handleCreateNewCycle)} action="">
        <FormContainer>
          <label htmlFor="task"> Vou trabalhar em </label>
          <TaskInput
            id="task"
            list="task-suggestions"
            placeholder="Dê um nome para o seu projeto"
            disabled={!!activeCycle}
            {...register('task')}
          />

          <datalist id="task-suggestions">
            <option value="Projeto 1" />
            <option value="Projeto 2" />
            <option value="Projeto 3" />
            <option value="Projeto 4" />
          </datalist>

          <label htmlFor=""> durante </label>
          <MinutesAmountInput
            type="number"
            id="minutesAmount"
            placeholder="00"
            step={5}
            min={5}
            max={60}
            disabled={!!activeCycle}
            {...register('minutesAmount', { valueAsNumber: true })}
          />

          <span>minutos.</span>
        </FormContainer>

        <CountdownContainer>
          <span> {minutes[0]} </span>
          <span> {minutes[1]} </span>
          <Separator>:</Separator>
          <span> {seconds[0]} </span>
          <span> {seconds[1]} </span>
        </CountdownContainer>

        {activeCycle ? (
          <StopCountdownButton onClick={handleInterruptCycle} type="button">
            <HandPalm size={24} />
            Interromper
          </StopCountdownButton>
        ) : (
          <StartCountdownButton disabled={isSubmitDisabled} type="submit">
            <Play size={24} />
            Começar
          </StartCountdownButton>
        )}
      </form>
    </HomeContainer>
  )
}
