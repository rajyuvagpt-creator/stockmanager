import * as tf from '@tensorflow/tfjs'

interface TrainingData {
  date: Date
  quantity: number
}

export class DemandForecaster {
  private model: tf.LayersModel | null = null
  private lookback = 7
  private minValue = 0
  private maxValue = 1

  private normalize(data: number[]): number[] {
    this.minValue = Math.min(...data)
    this.maxValue = Math.max(...data)
    if (this.maxValue === this.minValue) return data.map(() => 0.5)
    return data.map((v) => (v - this.minValue) / (this.maxValue - this.minValue))
  }

  private denormalize(value: number): number {
    return value * (this.maxValue - this.minValue) + this.minValue
  }

  private buildModel(): tf.LayersModel {
    const model = tf.sequential()

    model.add(
      tf.layers.lstm({
        units: 50,
        returnSequences: false,
        inputShape: [this.lookback, 1],
      })
    )

    model.add(tf.layers.dense({ units: 25, activation: 'relu' }))
    model.add(tf.layers.dense({ units: 1 }))

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
    })

    return model
  }

  async train(data: TrainingData[]): Promise<void> {
    if (data.length < this.lookback + 1) {
      throw new Error(`Need at least ${this.lookback + 1} data points for training`)
    }

    const quantities = data.map((d) => d.quantity)
    const normalized = this.normalize(quantities)

    const xData: number[][][] = []
    const yData: number[] = []

    for (let i = this.lookback; i < normalized.length; i++) {
      const seq = normalized.slice(i - this.lookback, i).map((v) => [v])
      xData.push(seq)
      yData.push(normalized[i])
    }

    const xs = tf.tensor3d(xData)
    const ys = tf.tensor2d(yData, [yData.length, 1])

    this.model = this.buildModel()

    await this.model.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.1,
      verbose: 0,
    })

    xs.dispose()
    ys.dispose()
  }

  async predict(recentData: number[], steps = 7): Promise<number[]> {
    if (!this.model) throw new Error('Model not trained')
    if (recentData.length < this.lookback) {
      throw new Error(`Need ${this.lookback} recent data points`)
    }

    const normalized = this.normalize(recentData)
    const predictions: number[] = []
    let current = normalized.slice(-this.lookback)

    for (let i = 0; i < steps; i++) {
      const input = tf.tensor3d([current.map((v) => [v])])
      const pred = this.model.predict(input) as tf.Tensor
      const value = (await pred.data())[0]
      predictions.push(this.denormalize(value))
      current = [...current.slice(1), value]
      input.dispose()
      pred.dispose()
    }

    return predictions
  }

  async save(path: string): Promise<void> {
    if (!this.model) throw new Error('Model not trained')
    await this.model.save(`file://${path}`)
  }

  async load(path: string): Promise<void> {
    this.model = await tf.loadLayersModel(`file://${path}/model.json`)
  }
}
