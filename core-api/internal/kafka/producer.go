package kafka

import (
	"context"
	"fmt"
	"log"

	"github.com/segmentio/kafka-go"
)

var Writer *kafka.Writer

func InitProducer() {
	// Initialize the Pure Go Kafka Writer
	Writer = &kafka.Writer{
		Addr:         kafka.TCP("kafka:9092"),
		Balancer:     &kafka.LeastBytes{},
		RequiredAcks: kafka.RequireAll, // Same as "acks": "all" (Zero Data Loss)
	}

	fmt.Println("✅ Successfully connected to Kafka Producer (Pure Go)!")
}

// ProduceMessage is a clean helper function to send messages
func ProduceMessage(topic string, message []byte) error {
	err := Writer.WriteMessages(context.Background(),
		kafka.Message{
			Topic: topic,
			Value: message,
		},
	)
	return err
}

func CloseProducer() {
	if Writer != nil {
		err := Writer.Close()
		if err != nil {
			log.Printf("❌ Error closing Kafka producer: %v\n", err)
		} else {
			fmt.Println("🛑 Kafka Producer closed.")
		}
	}
}
